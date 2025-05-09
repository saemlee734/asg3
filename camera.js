class Camera {
    constructor() {
        this.eye = new Vector3([0, 0, 3]);  
        this.at = new Vector3([1, 0, 3]);
        this.up = new Vector3([0, 1, 0]);
        this.fov = 60.0;
        
        this._tempVec = new Vector3();
        this._tempVec2 = new Vector3();
        this._tempMat = new Matrix4();
        
        this.viewMatrix = new Matrix4();
        this.projectionMatrix = new Matrix4();
        
        this.speed = 0.05;
        this.y = 0;
        this.xAngle = 0;
        
        this.updateViewMatrix();
        this.updateProjectionMatrix();
    }

    updateViewMatrix() {
        this.viewMatrix.setLookAt(
            this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
            this.at.elements[0], this.at.elements[1], this.at.elements[2],
            this.up.elements[0], this.up.elements[1], this.up.elements[2]
        );
    }

    updateProjectionMatrix() {
        this.projectionMatrix.setPerspective(this.fov, canvas.width/canvas.height, 0.1, 1000);
    }

    moveForward() {
        this._tempVec.set(this.at).sub(this.eye).normalize().mul(this.speed);
        this.eye.add(this._tempVec);
        this.at.add(this._tempVec);
        this.updateViewMatrix();
    }

    moveBackward() {
        this._tempVec.set(this.eye).sub(this.at).normalize().mul(this.speed);
        this.eye.add(this._tempVec);
        this.at.add(this._tempVec);
        this.updateViewMatrix();
    }

    moveLeft() {
        this._tempVec.set(this.at).sub(this.eye);
        this._tempVec2.set(Vector3.cross(this.up, this._tempVec)).normalize().mul(this.speed);
        this.eye.add(this._tempVec2);
        this.at.add(this._tempVec2);
        this.updateViewMatrix();
    }
    
    moveRight() {
        this._tempVec.set(this.at).sub(this.eye);
        this._tempVec2.set(Vector3.cross(this._tempVec, this.up)).normalize().mul(this.speed);
        this.eye.add(this._tempVec2);
        this.at.add(this._tempVec2);
        this.updateViewMatrix();
    }

    panLeft(alpha) {
        this._tempVec.set(this.at).sub(this.eye);
        this._tempMat.setRotate(alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        this._tempVec2.set(this._tempMat.multiplyVector3(this._tempVec)).normalize();
        this.at.set(this.eye).add(this._tempVec2);
        this.updateViewMatrix();
    }

    panRight(alpha) {
        this.panLeft(-alpha);
    }

    panUp(alpha) {
        if(this.at.elements[1] - this.eye.elements[1] > 0.99 && alpha < 0) return;
        if(this.at.elements[1] - this.eye.elements[1] < -0.99 && alpha > 0) return;
        
        this._tempVec.set(this.at).sub(this.eye);
        this._tempVec2.set(Vector3.cross(this._tempVec, this.up)).normalize();
        this._tempMat.setRotate(-alpha, this._tempVec2.elements[0], this._tempVec2.elements[1], this._tempVec2.elements[2]);
        this._tempVec2.set(this._tempMat.multiplyVector3(this._tempVec)).normalize();
        this.at.set(this.eye).add(this._tempVec2);
        this.updateViewMatrix();
    }

    panDown(alpha) {  
        this.panUp(-alpha);
    }

    mousePan(dX, dY) {
        this.panRight(dX * 0.1);
        this.panUp(dY * 0.1);
    }
}