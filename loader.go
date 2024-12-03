package main

import (
	"fmt"
	"os"
	"sort"
	"time"

	"github.com/hashicorp/golang-lru/v2/expirable"
	"github.com/linkedin/goavro/v2"
	"github.com/samber/lo"
)

type FrameDataItem interface {
	GetT() float32
	SetT(float32)
	GetID() int32
}

type Frame[T any] struct {
	T    float32 `json:"t"`
	Data []T     `json:"data"`
}

func (f *Frame[T]) String() string {
	return fmt.Sprintf("Frame{T: %f, len(Data): %d}", f.T, len(f.Data))
}

// TODO: cache
type Loader[T any, PT interface {
	FrameDataItem
	*T
}] struct {
	scanner *Scanner
	newFunc func(map[string]any) PT
	cache   *expirable.LRU[string, []*Frame[PT]] // file name -> frames
}

func NewLoader[T any, PT interface {
	FrameDataItem
	*T
}](scanner *Scanner, newFunc func(map[string]any) PT) *Loader[T, PT] {
	return &Loader[T, PT]{
		scanner: scanner,
		newFunc: newFunc,
		cache:   expirable.NewLRU[string, []*Frame[PT]](64, nil, 1*time.Minute),
	}
}

// range: [start, end]
func (l *Loader[T, PT]) Load(start, end float64) ([]*Frame[PT], error) {
	files := l.scanner.Find(start, end)
	frames := make([]*Frame[PT], 0)
	for _, f := range files {
		// check cache
		if cached, ok := l.cache.Get(f.Path); ok {
			frames = append(frames, cached...)
			continue
		}
		// init
		file, err := os.Open(f.Path)
		if err != nil {
			return nil, err
		}
		ocfReader, err := goavro.NewOCFReader(file)
		if err != nil {
			return nil, err
		}
		// read
		raws := make(map[float32]map[int32]PT)
		for ocfReader.Scan() {
			datum, err := ocfReader.Read()
			if err != nil {
				return nil, err
			}
			record := datum.(map[string]interface{})
			raw := l.newFunc(record)
			t := raw.GetT()
			if _, ok := raws[t]; !ok {
				raws[t] = make(map[int32]PT)
			}
			raws[t][raw.GetID()] = raw
		}
		// incremental
		sortedTs := lo.Keys(raws)
		sort.Slice(sortedTs, func(i, j int) bool {
			return sortedTs[i] < sortedTs[j]
		})
		for i := 1; i < len(sortedTs); i++ {
			last := raws[sortedTs[i-1]]
			current := raws[sortedTs[i]]
			for id, raw := range last {
				if _, ok := current[id]; !ok {
					// copy from the last frame
					copy := *raw
					var pt PT = &copy
					pt.SetT(sortedTs[i])
					current[id] = pt
				}
				// else: current frame has the same id, so no need to copy
			}
		}
		// add to frames
		for _, t := range sortedTs {
			thisFrame := &Frame[PT]{
				T:    t,
				Data: lo.Values(raws[t]),
			}
			frames = append(frames, thisFrame)
		}
		// cache
		l.cache.Add(f.Path, frames)
	}

	// choose [start, end] frames
	frames = lo.Filter(frames, func(frame *Frame[PT], _ int) bool {
		return float64(frame.T) >= start && float64(frame.T) <= end
	})
	return frames, nil
}
