package main

import (
	"log"
	"testing"

	"github.com/samber/lo"
	"github.com/stretchr/testify/assert"
)

// just for manually debugging
func TestLoader(t *testing.T) {
	dir := "E:/codes/moss-ui/data/log/tl"
	scanner, err := NewScanner(dir)
	assert.Nil(t, err)

	files := scanner.Find(0, 998)
	log.Printf("files: %+v", files)

	tlLoader := NewLoader(scanner, NewFrontendTL)
	res, err := tlLoader.Load(10, 20)
	assert.Nil(t, err)
	size := lo.Min([]int{len(res), 10})
	log.Printf("res: %+v", res[:size])
}
