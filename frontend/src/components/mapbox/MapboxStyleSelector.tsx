import { Select } from "antd"
import { CSSProperties, useEffect, useState } from "react"


export const STYLES: { [key: string]: string | mapboxgl.Style } = {
    "Satellite Street": "mapbox://styles/mapbox/satellite-streets-v12",
    "Streets": "mapbox://styles/mapbox/streets-v11",
    "Outdoors": "mapbox://styles/mapbox/outdoors-v11",
    "Light": "mapbox://styles/mapbox/light-v10",
    "Dark": "mapbox://styles/mapbox/dark-v10",
    "Satellite": "mapbox://styles/mapbox/satellite-v9",
    "OSM": {
        name: 'osm',
        version: 8,
        glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
        sources: {
            'osm-raster-tiles': {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution:
                    '&copy <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }
        },
        layers: [
            {
                id: 'osm-raster-layer',
                type: 'raster',
                source: 'osm-raster-tiles',
                minzoom: 0,
                maxzoom: 22
            }
        ]
    },
}

// selector to choose map style
export const useMapboxStyleSelector = (props: {
    style?: CSSProperties
}) => {
    const [styles, setStyles] = useState<{ [key: string]: string | mapboxgl.Style }>(STYLES)
    const [selectedStyleLabel, setSelectedStyleLabel] = useState<string>("OSM")

    // GET https://tile.openstreetmap.org/ to test connection
    // if the connection is failed, fallback to Streets style
    useEffect(() => {
        if (selectedStyleLabel === "OSM") {
            fetch("https://tile.openstreetmap.org/", { cache: "no-cache", signal: AbortSignal.timeout(2000) })
                .then(() => {
                    console.log("OSM is available")
                })
                .catch(() => {
                    console.log("OSM is not available, fallback to Streets")
                    setSelectedStyleLabel("Streets")
                })
        }
    }, [])

    const StyleSelector = <Select
        value={selectedStyleLabel}
        onChange={setSelectedStyleLabel}
        style={props.style}
    >
        {Object.entries(styles).map(([label]) => (
            <Select.Option key={label} value={label}>
                {label}
            </Select.Option>
        ))}
    </Select>

    return {
        StyleSelector,
        selectedStyle: styles[selectedStyleLabel] ?? "OSM",
        setStyles
    }
}
