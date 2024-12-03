package main

import (
	"fmt"
	"math"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
)

type TimeRangeFile struct {
	// time range: [StartT, EndT]

	StartT float64
	EndT   float64

	// file path

	Path string
}

// Scan a directory for files.
// Organize files into a binary tree with the time range as the key.
// So we can quickly find the files that are in the time range and load the data.
// Assume there are a time range record for each files.
// Now it is stored in the file name.
type Scanner struct {
	timeRangeFiles []TimeRangeFile
}

func NewScanner(dir string) (*Scanner, error) {
	files, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}
	timeRangeFiles := make([]TimeRangeFile, 0)
	for _, file := range files {
		if file.IsDir() {
			continue
		}
		ext := filepath.Ext(file.Name())
		if ext != ".avro" {
			continue
		}
		// two schema of file name:
		// 1. {time}.avro
		// 2. {start_time}-{end_time}.avro
		name := strings.TrimSuffix(file.Name(), ext)
		timeRange := strings.Split(name, "-")
		if len(timeRange) == 1 {
			time, err := strconv.ParseFloat(timeRange[0], 64)
			if err != nil {
				continue
			}
			f := TimeRangeFile{
				StartT: time,
				EndT:   time,
				Path:   path.Join(dir, file.Name()),
			}
			timeRangeFiles = append(timeRangeFiles, f)
		} else if len(timeRange) == 2 {
			startTime, err := strconv.ParseFloat(timeRange[0], 64)
			if err != nil {
				continue
			}
			endTime, err := strconv.ParseFloat(timeRange[1], 64)
			if err != nil {
				continue
			}
			f := TimeRangeFile{
				StartT: startTime,
				EndT:   endTime,
				Path:   path.Join(dir, file.Name()),
			}
			timeRangeFiles = append(timeRangeFiles, f)
		}
	}
	sort.Slice(timeRangeFiles, func(i, j int) bool {
		return timeRangeFiles[i].StartT < timeRangeFiles[j].StartT
	})
	// overlap check
	for i := 1; i < len(timeRangeFiles); i++ {
		if timeRangeFiles[i].StartT < timeRangeFiles[i-1].EndT {
			return nil, fmt.Errorf("overlap time range: %f-%f, %f-%f", timeRangeFiles[i-1].StartT, timeRangeFiles[i-1].EndT, timeRangeFiles[i].StartT, timeRangeFiles[i].EndT)
		}
	}

	return &Scanner{timeRangeFiles: timeRangeFiles}, nil
}

func (s *Scanner) StartT() float64 {
	if len(s.timeRangeFiles) == 0 {
		return math.Inf(1)
	}
	return s.timeRangeFiles[0].StartT
}

func (s *Scanner) EndT() float64 {
	if len(s.timeRangeFiles) == 0 {
		return math.Inf(-1)
	}
	return s.timeRangeFiles[len(s.timeRangeFiles)-1].EndT
}

// range: [startT, endT]
func (s *Scanner) Find(startT, endT float64) []TimeRangeFile {
	// find the first file
	i := sort.Search(len(s.timeRangeFiles), func(i int) bool {
		return s.timeRangeFiles[i].EndT >= startT
	})
	if i == len(s.timeRangeFiles) {
		return nil
	}
	// find the last file
	j := sort.Search(len(s.timeRangeFiles), func(j int) bool {
		return s.timeRangeFiles[j].StartT > endT
	})
	if j == len(s.timeRangeFiles) {
		return s.timeRangeFiles[i:]
	}
	return s.timeRangeFiles[i:j]
}
