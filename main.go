package main

import (
	"embed"
	"io/fs"
	"net/http"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed all:resources
var resources embed.FS

func main() {
	var err error

	models, err := fs.Sub(resources, "resources")
	if err != nil {
		panic(err)
	}
	// Create an instance of the app structure
	app := NewApp()

	// Create application with options
	err = wails.Run(&options.App{
		Title:  "MObility Simulation System UI",
		Width:  1366,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets:  assets,
			Handler: http.FileServer(http.FS(models)),
		},
		BackgroundColour: &options.RGBA{R: 255, G: 255, B: 255, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
