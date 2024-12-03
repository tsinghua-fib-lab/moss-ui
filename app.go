package main

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"math"
	"os"
	"path"
	"path/filepath"
	"sort"

	"github.com/samber/lo"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const TITLE = "MObility Simulation System UI"

type Sim struct {
	Name      string  `json:"name"`
	Start     float64 `json:"start"`
	Steps     float64 `json:"steps"`
	MapBase64 string  `json:"map_base64"`
}

// App struct
type App struct {
	ctx context.Context

	tlLoader         *Loader[FrontendTL, *FrontendTL]
	vehicleLoader    *Loader[FrontendCar, *FrontendCar]
	pedestrianLoader *Loader[FrontendPedestrian, *FrontendPedestrian]
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

type LoadReturn struct {
	Sim *Sim   `json:"sim"`
	Err string `json:"err"`
}

// try to load a directory with MOSS output files
func (a *App) Open() LoadReturn {
	file, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title:           "Select a MOSS output project",
		DefaultFilename: "moss.yml",
	})
	if err != nil {
		return LoadReturn{nil, err.Error()}
	}
	absFile, err := filepath.Abs(file)
	if err != nil {
		return LoadReturn{nil, err.Error()}
	}
	dir := filepath.Dir(absFile)

	// 1. load dir / "map.pb"
	mapPath := path.Join(dir, "map.pb")
	mapBytes, err := os.ReadFile(mapPath)
	if err != nil {
		// if map.pb not found, return error
		if errors.Is(err, os.ErrNotExist) {
			return LoadReturn{nil, "`map.pb` not found in the directory"}
		}
		return LoadReturn{nil, err.Error()}
	}
	// 2. load dir / "vehicle" / {time}.avro
	vehicleDir := path.Join(dir, "vehicle")
	vehicleScanner, err := NewScanner(vehicleDir)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return LoadReturn{nil, "`vehicle` directory not found in the directory"}
		}
		return LoadReturn{nil, err.Error()}
	}
	a.vehicleLoader = NewLoader(vehicleScanner, NewFrontendCar)

	// 3. load dir / "pedestrian" / {time}.avro
	pedestrianDir := path.Join(dir, "pedestrian")
	pedestrianScanner, err := NewScanner(pedestrianDir)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return LoadReturn{nil, "`pedestrian` directory not found in the directory"}
		}
		return LoadReturn{nil, err.Error()}
	}
	a.pedestrianLoader = NewLoader(pedestrianScanner, NewFrontendPedestrian)

	// 4. load dir / "tl" / {time}.avro
	tlDir := path.Join(dir, "tl")
	tlScanner, err := NewScanner(tlDir)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return LoadReturn{nil, "`tl` directory not found in the directory"}
		}
		return LoadReturn{nil, err.Error()}
	}
	a.tlLoader = NewLoader(tlScanner, NewFrontendTL)

	// build Sim

	allStartT := math.Inf(1)
	allEndT := math.Inf(-1)
	for _, scanner := range []*Scanner{vehicleScanner, pedestrianScanner, tlScanner} {
		if startT := scanner.StartT(); startT < allStartT {
			allStartT = startT
		}
		if endT := scanner.EndT(); endT > allEndT {
			allEndT = endT
		}
	}

	// modify app title
	runtime.WindowSetTitle(a.ctx, TITLE+" - "+dir)

	return LoadReturn{&Sim{
		Name:      dir,
		Start:     allStartT,
		Steps:     allEndT - allStartT,
		MapBase64: base64.StdEncoding.EncodeToString(mapBytes),
	}, ""}
}

func (a *App) Close() {
	a.vehicleLoader = nil
	a.pedestrianLoader = nil
	a.tlLoader = nil
	runtime.WindowSetTitle(a.ctx, TITLE)
}

type FetchCarReturn struct {
	Data []*FrontendCarFrame `json:"data"`
	Err  string              `json:"err"`
}

func (a *App) FetchCar(startT, endT float64, xMin, xMax, yMin, yMax float32) *FetchCarReturn {
	frames, err := a.vehicleLoader.Load(startT, endT)
	if err != nil {
		return &FetchCarReturn{nil, err.Error()}
	}
	frontendFrames := make([]*FrontendCarFrame, len(frames))
	// filter by x, y
	for i, frame := range frames {
		frontendFrames[i] = &FrontendCarFrame{
			T: frame.T,
			Data: lo.Filter(frame.Data, func(car *FrontendCar, _ int) bool {
				return car.X >= xMin && car.X <= xMax && car.Y >= yMin && car.Y <= yMax
			}),
		}
	}
	// sort by t
	sort.Slice(frontendFrames, func(i, j int) bool {
		return frontendFrames[i].T < frontendFrames[j].T
	})
	// debug string
	debugStr := fmt.Sprintf("len(FetchCar): %v", len(frontendFrames))
	for _, frame := range frontendFrames {
		debugStr += fmt.Sprintf("\n  t=%v, len(Data): %v", frame.T, len(frame.Data))
	}
	runtime.LogDebug(a.ctx, debugStr)
	return &FetchCarReturn{frontendFrames, ""}
}

type FetchPedReturn struct {
	Data []*FrontendPedestrianFrame `json:"data"`
	Err  string                     `json:"err"`
}

func (a *App) FetchPed(startT, endT float64, xMin, xMax, yMin, yMax float32) *FetchPedReturn {
	frames, err := a.pedestrianLoader.Load(startT, endT)
	if err != nil {
		return &FetchPedReturn{nil, err.Error()}
	}
	frontendFrames := make([]*FrontendPedestrianFrame, len(frames))
	// filter by x, y
	for i, frame := range frames {
		frontendFrames[i] = &FrontendPedestrianFrame{
			T: frame.T,
			Data: lo.Filter(frame.Data, func(ped *FrontendPedestrian, _ int) bool {
				return ped.X >= xMin && ped.X <= xMax && ped.Y >= yMin && ped.Y <= yMax
			}),
		}
	}
	return &FetchPedReturn{frontendFrames, ""}
}

type FetchTLReturn struct {
	Data []*FrontendTLFrame `json:"data"`
	Err  string             `json:"err"`
}

func (a *App) FetchTL(startT, endT float64) *FetchTLReturn {
	frames, err := a.tlLoader.Load(startT, endT)
	if err != nil {
		return &FetchTLReturn{nil, err.Error()}
	}
	frontendFrames := make([]*FrontendTLFrame, len(frames))
	for i, frame := range frames {
		frontendFrames[i] = &FrontendTLFrame{
			T:    frame.T,
			Data: frame.Data,
		}
	}
	return &FetchTLReturn{frontendFrames, ""}
}
