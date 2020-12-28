PROJECT   ?= rngtng/issue-to-jekyll-post
BUILD_TAG ?= build-local
IMAGE = $(PROJECT):$(BUILD_TAG)

build:
	docker build -t $(IMAGE) .

dev:
	docker run --entrypoint bash --volume "$(shell pwd):/usr/src/app" -it $(IMAGE)