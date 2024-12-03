package main

import "fmt"

type FrontendCar struct {
	ID        int32   `json:"id"`
	T         float32 `json:"t"`
	X         float32 `json:"x"`
	Y         float32 `json:"y"`
	LaneID    int32   `json:"laneId"`
	Direction float32 `json:"direction"`
	V         float32 `json:"v"`
	Model     string  `json:"model"`
}

func (r *FrontendCar) GetT() float32 {
	return r.T
}

func (r *FrontendCar) SetT(t float32) {
	r.T = t
}

func (r *FrontendCar) GetID() int32 {
	return r.ID
}

func (r *FrontendCar) String() string {
	return fmt.Sprintf("Car{ID: %d, T: %f, X: %f, Y: %f, LaneID: %d, Direction: %f, V: %f, Model: %s}", r.ID, r.T, r.X, r.Y, r.LaneID, r.Direction, r.V, r.Model)
}

func NewFrontendCar(record map[string]any) *FrontendCar {
	return &FrontendCar{
		ID:        record["id"].(int32),
		T:         record["t"].(float32),
		X:         record["x"].(float32),
		Y:         record["y"].(float32),
		LaneID:    record["parent_id"].(int32),
		Direction: record["direction"].(float32),
		V:         record["v"].(float32),
		Model:     record["model"].(string),
	}
}

type FrontendCarFrame struct {
	T    float32        `json:"t"`
	Data []*FrontendCar `json:"data"`
}

type FrontendPedestrian struct {
	ID        int32   `json:"id"`
	T         float32 `json:"t"`
	X         float32 `json:"x"`
	Y         float32 `json:"y"`
	ParentID  int32   `json:"parentId"`
	Direction float32 `json:"direction"`
	V         float32 `json:"v"`
}

func (r *FrontendPedestrian) GetT() float32 {
	return r.T
}

func (r *FrontendPedestrian) SetT(t float32) {
	r.T = t
}

func (r *FrontendPedestrian) GetID() int32 {
	return r.ID
}

func (r *FrontendPedestrian) String() string {
	return fmt.Sprintf("Pedestrian{ID: %d, T: %f, X: %f, Y: %f, ParentID: %d, Direction: %f, V: %f}", r.ID, r.T, r.X, r.Y, r.ParentID, r.Direction, r.V)
}

func NewFrontendPedestrian(record map[string]any) *FrontendPedestrian {
	return &FrontendPedestrian{
		ID:        record["id"].(int32),
		T:         record["t"].(float32),
		X:         record["x"].(float32),
		Y:         record["y"].(float32),
		ParentID:  record["parent_id"].(int32),
		Direction: record["direction"].(float32),
		V:         record["v"].(float32),
	}
}

type FrontendPedestrianFrame struct {
	T    float32               `json:"t"`
	Data []*FrontendPedestrian `json:"data"`
}

type FrontendTL struct {
	ID    int32   `json:"id"`
	T     float32 `json:"t"`
	State int32   `json:"state"`
}

func (r *FrontendTL) GetT() float32 {
	return r.T
}

func (r *FrontendTL) SetT(t float32) {
	r.T = t
}

func (r *FrontendTL) GetID() int32 {
	return r.ID
}

func (r *FrontendTL) String() string {
	return fmt.Sprintf("TL{ID: %d, T: %f, State: %d}", r.ID, r.T, r.State)
}

func NewFrontendTL(record map[string]any) *FrontendTL {
	return &FrontendTL{
		ID:    record["id"].(int32),
		T:     record["t"].(float32),
		State: record["state"].(int32),
	}
}

type FrontendTLFrame struct {
	T    float32       `json:"t"`
	Data []*FrontendTL `json:"data"`
}

type FrontendRoadStatus struct {
	ID    int32   `json:"id"`
	T     float32 `json:"t"`
	Level int32   `json:"level"`
}

func (r *FrontendRoadStatus) GetT() float32 {
	return r.T
}

func (r *FrontendRoadStatus) String() string {
	return fmt.Sprintf("RoadStatus{ID: %d, T: %f, Level: %d}", r.ID, r.T, r.Level)
}

func NewFrontendRoadStatus(record map[string]any) *FrontendRoadStatus {
	return &FrontendRoadStatus{
		ID:    record["id"].(int32),
		T:     record["t"].(float32),
		Level: record["level"].(int32),
	}
}

type FrontendRoadStatusFrame struct {
	T    float32               `json:"t"`
	Data []*FrontendRoadStatus `json:"data"`
}
