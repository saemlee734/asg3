class World {
    constructor() {
        this.blocks = [];
        this.width = 32;
        this.height = 32;
        this.depth = 32;

        // Initialize world with all 1s
        this.world = Array(this.width).fill().map(() => Array(this.depth).fill(1));

        // Set outer border to 3
        for (let x = 0; x < this.width; x++) {
            for (let z = 0; z < this.depth; z++) {
                if (x === 0 || x === this.width - 1 || z === 0 || z === this.depth - 1) {
                    this.world[x][z] = 3;
                }
            }
        }

        // Set inner two rows and columns to 2
        for (let x = 1; x < this.width - 1; x++) {
            for (let z = 1; z < this.depth - 1; z++) {
                if (x === 1 || x === this.width - 2 || z === 1 || z === this.depth - 2 ||
                    x === 2 || x === this.width - 3 || z === 2 || z === this.depth - 3) {
                    this.world[x][z] = 2;
                }
            }
        }

        // Initialize 3D blocks array
        for (let x = 0; x < this.width; x++) {
            this.blocks.push([]);
            for (let z = 0; z < this.depth; z++) {
                this.blocks[x].push([]);
                for (let y = 0; y < this.height; y++) {
                    this.blocks[x][z].push(0);
                }
            }
        }

        this.createZombieDen(25, 25);
        this.createRandomDirtHills(3);
        this.createRandomStructures(3);
    }

    createZombieDen(cornerX, cornerZ) {
        this.buildPlankStructure(cornerX, cornerZ, true);
    }

    createRandomStructures(count) {
        let attempts = 0;
        let placed = 0;
        const centerBuffer = 10;

        while (placed < count && attempts < 100) {
            attempts++;
            const x = Math.floor(Math.random() * (this.width - 10)) + 2;
            const z = Math.floor(Math.random() * (this.depth - 10)) + 2;

            if (Math.abs(x - 25) < 10 && Math.abs(z - 25) < 10) continue;
            if (Math.abs(x - this.width / 2) < centerBuffer && Math.abs(z - this.depth / 2) < centerBuffer) continue;

            this.buildPlankStructure(x, z, false);
            placed++;
        }
    }

    buildPlankStructure(cornerX, cornerZ, isZombieDen) {
        const width = 7;
        const depth = 7;
        const height = isZombieDen ? 7 : 5;

        for (let x = cornerX; x < cornerX + width; x++) {
            for (let z = cornerZ; z < cornerZ + depth; z++) {
                if (x < this.width && z < this.depth) {
                    this.blocks[x][z][0] = 1;
                }
            }
        }

        for (let y = 1; y < height; y++) {
            for (let x = cornerX; x < cornerX + width; x++) {
                if (x < cornerX + 2 || x > cornerX + width - 3) {
                    this.blocks[x][cornerZ][y] = 1;
                    this.blocks[x][cornerZ + depth - 1][y] = 1;
                }
            }

            for (let z = cornerZ; z < cornerZ + depth; z++) {
                if (z < cornerZ + 2 || z > cornerZ + depth - 3) {
                    this.blocks[cornerX][z][y] = 1;
                    this.blocks[cornerX + width - 1][z][y] = 1;
                }
            }
        }

        for (let x = cornerX; x < cornerX + width; x++) {
            for (let z = cornerZ; z < cornerZ + depth; z++) {
                if (isZombieDen || Math.random() > 0.3) {
                    this.blocks[x][z][height] = 1;
                }
            }
        }
    }

    createRandomDirtHills(count) {
        const centerBuffer = 10;
        let attempts = 0;
        let placed = 0;

        while (placed < count && attempts < 100) {
            attempts++;
            const baseSize = Math.floor(Math.random() * 4) + 3;
            const height = Math.floor(Math.random() * 4) + 2;
            const x = Math.floor(Math.random() * (this.width - baseSize - 4)) + 2;
            const z = Math.floor(Math.random() * (this.depth - baseSize - 4)) + 2;

            if (Math.abs(x - this.width / 2) < centerBuffer && Math.abs(z - this.depth / 2) < centerBuffer) continue;

            this.createDirtHill(x, z, baseSize, height);
            placed++;
        }
    }

    createDirtHill(cornerX, cornerZ, baseSize = 5, maxHeight = 5) {
        for (let layer = 0; layer < maxHeight; layer++) {
            let size = baseSize - layer;
            if (size <= 0) break;
            for (let dx = 0; dx < size; dx++) {
                for (let dz = 0; dz < size; dz++) {
                    let x = cornerX + dx;
                    let z = cornerZ + dz;
                    let y = layer;
                    if (x < this.width && z < this.depth && y < this.height) {
                        this.blocks[x][z][y] = 1;
                    }
                }
            }
        }
    }

    drawMap() {
        let cube = new Cube();
        cube.textureOption = [GRASS_SIDE, GRASS_SIDE, GRASS_SIDE, GRASS_SIDE, GRASS_TOP, GRASS_BOTTOM];
        cube.color = [1, 0, 0, 1];
        for (let x = 0; x < this.width; x++) {
            for (let z = 0; z < this.depth; z++) {
                let y = this.world[x][z];
                cube.matrix.setTranslate(x * 0.25 - 4, y * 0.25 - 1, z * 0.25 - 4);
                cube.matrix.scale(0.25, 0.25, 0.25);
                cube.render();
            }
        }
    }

    drawBlocks() {
        let cube = new Cube();
        cube.textureOption = [STONE, STONE, STONE, STONE, STONE, STONE];
        for (let x = 0; x < this.width; x++) {
            for (let z = 0; z < this.depth; z++) {
                for (let y = 0; y < this.height; y++) {
                    if (this.blocks[x][z][y] === 1) {
                        cube.matrix.setTranslate(x * 0.25 - 4, y * 0.25 - 1, z * 0.25 - 4);
                        cube.matrix.scale(0.25, 0.25, 0.25);
                        cube.render();
                    }
                }
            }
        }
    }

    placeBlock() {
        let x_eye = Math.floor((camera.eye.elements[0] + 4) * 4);
        let y_eye = Math.floor((camera.eye.elements[1] + 1) * 4);
        let z_eye = Math.floor((camera.eye.elements[2] + 4) * 4);

        let x_at = Math.floor((camera.at.elements[0] + 4) * 4);
        let y_at = Math.floor((camera.at.elements[1] + 1) * 4);
        let z_at = Math.floor((camera.at.elements[2] + 4) * 4);

        let dX = x_at - x_eye;
        let dZ = z_at - z_eye;

        if (0 <= x_eye && x_eye < this.width && 0 <= z_eye && z_eye < this.depth && 0 <= y_eye && y_eye < this.height) {
            if (dX == 0 && dZ > 0) {
                this.blocks[x_at][z_eye + 1][y_eye] = 1;
            } else if (dX == 0 && dZ < 0) {
                this.blocks[x_eye][z_eye - 1][y_eye] = 1;
            } else if (dX > 0 && dZ == 0) {
                this.blocks[x_eye + 1][z_eye][y_eye] = 1;
            } else if (dX < 0 && dZ == 0) {
                this.blocks[x_eye - 1][z_eye][y_eye] = 1;
            } else if (dX > 0 && dZ > 0) {
                this.blocks[x_eye + 1][z_eye + 1][y_eye] = 1;
            } else if (dX > 0 && dZ < 0) {
                this.blocks[x_eye + 1][z_eye - 1][y_eye] = 1;
            } else if (dX < 0 && dZ > 0) {
                this.blocks[x_eye - 1][z_eye + 1][y_eye] = 1;
            } else if (dX < 0 && dZ < 0) {
                this.blocks[x_eye - 1][z_eye - 1][y_eye] = 1;
            }

            console.log("Block placed at: " + x_eye + ", " + y_eye + ", " + z_eye);
        }
    }

    removeBlock() {
        let x_eye = Math.floor((camera.eye.elements[0] + 4) * 4);
        let y_eye = Math.floor((camera.eye.elements[1] + 1) * 4);
        let z_eye = Math.floor((camera.eye.elements[2] + 4) * 4);

        let x_at = Math.floor((camera.at.elements[0] + 4) * 4);
        let y_at = Math.floor((camera.at.elements[1] + 1) * 4);
        let z_at = Math.floor((camera.at.elements[2] + 4) * 4);

        let dX = x_at - x_eye;
        let dZ = z_at - z_eye;

        if (0 <= x_eye && x_eye < this.width && 0 <= z_eye && z_eye < this.depth && 0 <= y_eye && y_eye < this.height) {
            if (dX == 0 && dZ > 0) {
                this.blocks[x_eye][z_eye + 1][y_eye] = 0;
            } else if (dX == 0 && dZ < 0) {
                this.blocks[x_eye][z_eye - 1][y_eye] = 0;
            } else if (dX > 0 && dZ == 0) {
                this.blocks[x_eye + 1][z_eye][y_eye] = 0;
            } else if (dX < 0 && dZ == 0) {
                this.blocks[x_eye - 1][z_eye][y_eye] = 0;
            } else if (dX > 0 && dZ > 0) {
                this.blocks[x_eye + 1][z_eye + 1][y_eye] = 0;
            } else if (dX > 0 && dZ < 0) {
                this.blocks[x_eye + 1][z_eye - 1][y_eye] = 0;
            } else if (dX < 0 && dZ > 0) {
                this.blocks[x_eye - 1][z_eye + 1][y_eye] = 0;
            } else if (dX < 0 && dZ < 0) {
                this.blocks[x_eye - 1][z_eye - 1][y_eye] = 0;
            }

            console.log("Block removed at: " + x_eye + ", " + y_eye + ", " + z_eye);
        }
    }
}
