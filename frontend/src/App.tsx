import { useState } from 'react';
import './App.css';
import { Map as PbMap } from '@fiblab/cityproto/es/city/map/v2/map_pb';
import proj4 from "proj4";
import { FetchCar, FetchPed, FetchTL, Open, Close } from "../wailsjs/go/main/App";
import { LogPrint } from "../wailsjs/runtime/runtime";
import { Car, LngLat, LngLatBound, Pedestrian, Replay, Sim, TL } from '@fiblab/moss-replay';
import { Button, message } from 'antd';
import { patchProjStr } from './components/util';
import { LngLatZoom } from '@fiblab/moss-replay/src/_components/type';

const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiZmh5ZHJhbGlzayIsImEiOiJja3VzMWc5NXkwb3RnMm5sbnVvd3IydGY0In0.FrwFkYIMpLbU83K9rHSe8w';

const MAP_CENTER = {
    lng: 116.39124329043085,
    lat: 39.906120097057055,
    zoom: 10,
};

function parseMapBytes(mapBase64: string) {
    const uint8Array = new Uint8Array(atob(mapBase64).split("").map(c => c.charCodeAt(0)));
    const m = PbMap.fromBinary(uint8Array);
    if (!m.header) {
        LogPrint("No header in map");
        throw new Error("No header in map");
    }
    LogPrint(`Map ${m.header.name} with ${m.header.west}, ${m.header.east}, ${m.header.north}, ${m.header.south}, ${m.header.projection}`);
    const projector = proj4(patchProjStr(m.header.projection), "EPSG:4326");
    const centerX = (m.header.west + m.header.east) / 2;
    const centerY = (m.header.north + m.header.south) / 2;
    // unit: m
    const deltaX = m.header.east - m.header.west
    const deltaY = m.header.north - m.header.south
    const zoomX = Math.log2(360 * 128 * 1000 / deltaX)
    const zoomY = Math.log2(180 * 128 * 1000 / deltaY)
    const zoom = Math.min(zoomX, zoomY) + 1;
    const mapCenter = projector.forward([centerX, centerY]);
    const laneId2GeoJson = new Map();
    const allLaneGeoJson: GeoJSON.Feature[] = [];
    const junctionLaneGeoJson: GeoJSON.Feature[] = [];
    for (const pb of m.lanes) {
        const centerLineXY = pb.centerLine.nodes.map(n => projector.forward(n)).map(xy => [xy.x, xy.y])
        const geojson = {
            id: pb.id,
            type: "Feature",
            geometry: {
                type: "LineString",
                coordinates: centerLineXY
            },
            properties: {
                id: pb.id,
                type: pb.type,
            }
        } as GeoJSON.Feature;
        allLaneGeoJson.push(geojson);
        laneId2GeoJson.set(pb.id, geojson);
        if (pb.parentId >= 3_0000_0000) {
            junctionLaneGeoJson.push(geojson);
        }
    }
    const aoiGeoJson: GeoJSON.Feature[] = [];
    for (const pb of m.aois) {
        const polygonXY = pb.positions.map(n => projector.forward(n))
        if (polygonXY.length > 1) {
            const geojson = {
                id: pb.id,
                type: "Feature",
                geometry: {
                    type: "Polygon",
                    coordinates: [polygonXY.map(xy => [xy.x, xy.y])]
                },
                properties: {
                    id: pb.id,
                }
            } as GeoJSON.Feature;
            aoiGeoJson.push(geojson);
        } else if (polygonXY.length === 1) {
            const geojson = {
                id: pb.id,
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [polygonXY[0].x, polygonXY[0].y]
                },
                properties: {
                    id: pb.id,
                }
            } as GeoJSON.Feature;
            aoiGeoJson.push(geojson);
        }
    }
    const roadGeoJson: GeoJSON.Feature[] = [];
    for (const pb of m.roads) {
        const lid = pb.laneIds[Math.floor(pb.laneIds.length / 2)];
        const laneGeoJson = laneId2GeoJson.get(lid);
        // copy it
        const geojson = {
            id: pb.id,
            type: "Feature",
            geometry: laneGeoJson.geometry,
            properties: {
                id: pb.id,
            }
        } as GeoJSON.Feature;
        roadGeoJson.push(geojson);
    }
    return {
        mapCenter: { lng: mapCenter[0], lat: mapCenter[1], zoom: zoom },
        projector,
        allLaneGeoJson,
        junctionLaneGeoJson,
        aoiGeoJson,
        roadGeoJson,
    }
}

function App() {
    const [sim, setSim] = useState<Sim | undefined>(undefined);
    const [mapCenter, setMapCenter] = useState<LngLatZoom>(MAP_CENTER);
    const [aoiGeoJson, setAoiGeoJson] = useState<GeoJSON.Feature[]>([]);
    const [allLaneGeoJson, setAllLaneGeoJson] = useState<GeoJSON.Feature[]>([]);
    const [roadGeoJson, setRoadGeoJson] = useState<GeoJSON.Feature[]>([]);
    const [junctionLaneGeoJson, setJunctionLaneGeoJson] = useState<GeoJSON.Feature[]>([]);
    const [projector, setProjector] = useState<proj4.Converter | undefined>(undefined);

    return (<Replay
        sim={sim}
        mapCenter={mapCenter}
        onSetMapCenter={(center: LngLat) => {
            setMapCenter({ lng: center.lng, lat: center.lat, zoom: 18 });
        }}
        onCarFetch={async (startT: number, endT: number, bound?: LngLatBound) => {
            const [x1, y1] = projector.inverse([bound.lng1, bound.lat1]);
            const [x2, y2] = projector.inverse([bound.lng2, bound.lat2]);
            const result = await FetchCar(startT, endT, x1, x2, y1, y2);
            if (result.err.length > 0) {
                message.error(result.err, 5);
                return [];
            }
            console.log(JSON.stringify(result.data));
            const response = result.data.map((f) => {
                return {
                    t: f.t,
                    data: f.data.map((r) => {
                        const [lng, lat] = projector.forward([r.x, r.y]);
                        return {
                            id: r.id,
                            lat: lat,
                            lng: lng,
                            laneId: r.laneId,
                            direction: r.direction,
                            v: r.v,
                            model: r.model,
                        } as Car;
                    })
                }
            });
            console.log(JSON.stringify(response));
            return response;
        }}
        onPedestrianFetch={async (startT: number, endT: number, bound?: LngLatBound) => {
            const [x1, y1] = projector.inverse([bound.lng1, bound.lat1]);
            const [x2, y2] = projector.inverse([bound.lng2, bound.lat2]);
            const result = await FetchPed(startT, endT, x1, x2, y1, y2);
            if (result.err.length > 0) {
                message.error(result.err, 5);
                return [];
            }
            const response = result.data.map((f) => {
                return {
                    t: f.t,
                    data: f.data.map((r) => {
                        const [lng, lat] = projector.forward([r.x, r.y]);
                        return {
                            id: r.id,
                            lat: lat,
                            lng: lng,
                            parentId: r.parentId,
                            direction: r.direction,
                            v: r.v,
                        } as Pedestrian;
                    })
                };
            });
            return response;
        }}
        onTLFetch={async (startT: number, endT: number, bound?: LngLatBound) => {
            const result = await FetchTL(startT, endT);
            if (result.err.length > 0) {
                message.error(result.err, 5);
                return [];
            }
            const response = result.data.map((f) => {
                return {
                    t: f.t,
                    data: f.data.map((r) => {
                        return {
                            id: r.id,
                            state: r.state,
                        } as TL;
                    })
                };
            });
            return response;
        }}
        onRoadStatusFetch={async (startT, endT) => {
            return [];
        }}
        aoiGeoJson={aoiGeoJson}
        allLaneGeoJson={allLaneGeoJson}
        roadGeoJson={roadGeoJson}
        junctionLaneGeoJson={junctionLaneGeoJson}
        carModelPaths={{
            "mini": "/models/cars/car_mini_red.gltf",
            "normal": "/models/cars/car_normal_red.gltf",
            "bus": "/models/cars/bus_green01.gltf",
        }}
        defaultCarModelPath="/models/cars/car_normal_red.gltf"
        mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
        message={{
            info: (msg, duration) => message.info(msg, duration),
            success: (msg, duration) => message.success(msg, duration),
            warning: (msg, duration) => message.warning(msg, duration),
            error: (msg, duration) => message.error(msg, duration),
        }}
        extraHeader={sim === undefined ? <Button
            type="primary"
            onClick={async () => {
                const result = await Open();
                if (result.err) {
                    message.error(result.err, 5);
                    return;
                }
                const {
                    mapCenter,
                    projector,
                    allLaneGeoJson,
                    junctionLaneGeoJson,
                    aoiGeoJson,
                    roadGeoJson,
                } = parseMapBytes(result.sim.map_base64);
                setMapCenter(mapCenter);
                setProjector(projector);
                setAoiGeoJson(aoiGeoJson);
                setAllLaneGeoJson(allLaneGeoJson);
                setRoadGeoJson(roadGeoJson);
                setJunctionLaneGeoJson(junctionLaneGeoJson);
                setSim({
                    name: result.sim.name,
                    start: result.sim.start,
                    steps: result.sim.steps,
                });
                message.success(`${result.sim.name} Loaded`, 5);
            }}>Open</Button> : <Button danger type="primary" onClick={async () => {
                await Close();
                setSim(undefined);
                message.success("Closed", 5);
            }}>Close</Button>}
    />)
}

export default App
