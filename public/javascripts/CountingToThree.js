
window.onload = function() {

    $("body").css("overflow", "hidden");

    function serialize(selector) {
        var data = {};
        selector.serializeArray().map(function(x){data[x.name] = x.value;});
        return data;
    }

    $( "#username" ).submit(function( event ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        var data = serialize($("#username"));
        $.ajax({
            type: "POST",
            url: "newUser",
            json: true,
            data: data,
            success: function (data) {
                $("#formContainer").remove();
                let id = data[0].user_id;
                start3D(id);
            }
        });
    });


    function start3D(id) {


        // --------------------------------------- Init ---------------------------------------
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 300);
        const renderer = new THREE.WebGLRenderer();
        const controls = new THREE.PointerLockControls(camera);
        scene.add(controls.getObject());
        const raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10);
        renderer.setSize(window.innerWidth, window.innerHeight);
        var textureLoader = new THREE.TextureLoader();
        var loader = new THREE.OBJLoader();

        var objects = {};
        var humanHeight = 2.0;

        document.body.appendChild(renderer.domElement);

        var tanFOV = Math.tan(((Math.PI / 180) * camera.fov / 2));

        window.addEventListener('resize', onWindowResize, false);

        function onWindowResize() {
            camera.fov = (360 / Math.PI) * Math.atan(tanFOV * (window.innerHeight / window.innerHeight));
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.render(scene, camera);
        }

        var prevTime = performance.now();
        var velocity = new THREE.Vector3();
        var direction = new THREE.Vector3();

        var moveForward = false;
        var moveBackward = false;
        var moveLeft = false;
        var moveRight = false;
        var canJump = false;

        var personalLight;

        var send = 0;

        function makeMeshes() {

            var geometry = new THREE.CubeGeometry(0.5, 0.5, 0.5);
            var material = new THREE.MeshBasicMaterial({color: 0xFF31CA});
            var cube = new THREE.Mesh(geometry, material);

            cube.position.y = 1.8;
            scene.add(cube);

            var line = new THREE.Geometry();
            line.vertices.push(new THREE.Vector3(-3, 0, 0));
            line.vertices.push(new THREE.Vector3(0, 3, 0));
            line.vertices.push(new THREE.Vector3(3, 0, 0));
            line.vertices.push(new THREE.Vector3(0, -3, 0));
            line.vertices.push(new THREE.Vector3(-3, 0, 0));

            var lineMaterial = new THREE.LineBasicMaterial({color: 0x00B366});

            var lineMesh = new THREE.Line(line, lineMaterial);

            scene.add(lineMesh);


            var texture = textureLoader.load('../images/textures/texture.png');
            loadObject(loader, '../images/objects/human.obj', texture, "human");

            texture = new THREE.MeshPhysicalMaterial({color: 0xFE4FC8});
            texture.reflectivity = 1.0;
            texture.clearCoat = 1.0;
            loadObject(loader, '../images/objects/building.obj', texture, "building");

            texture = new THREE.MeshPhysicalMaterial({color: 0x00D2FF, transparent: true, opacity: 0.3});
            loadObject(loader, '../images/objects/buildingWindow.obj', texture, "buildingWindow");

            var MTLloader = new THREE.MTLLoader();
            MTLloader.load("../images/objects/arcade.mtl", function (material) {
                material.preload();

                loader.setMaterials(material);
                loader.load("../images/objects/arcade.obj", function (object) {
                    objects["arcade"] = object;
                    scene.add(object);
                }, function (xhr) {
                    console.log((xhr.loaded / xhr.total * 100) + "% loaded");
                }, function (error) {
                    console.log("ERROR!: " + error)
                });

            }, function (xhr) {
                console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
            }, function (err) {
                console.log("ERROR! " + err);
            });
        }

        function setUpScene() {
            var light = new THREE.PointLight(0xffffff, 1, 100);
            light.position.set(10, 10, 10);
            scene.add(light);

            personalLight = new THREE.PointLight(0xffffff, 1, 100);
            scene.add(personalLight);

            //objects["building"].position.y = 0;


            controls.getObject().position.z = 20;

        }


        function animate() {

            if (controls) {
                personalLight.position.copy(controls.getObject().position);
                raycaster.ray.origin.copy(controls.getObject().position);
                raycaster.ray.origin.y -= humanHeight;

                var objectArray = Object.values(objects);
                var intersections = raycaster.intersectObjects(objectArray);
                var onObject = intersections.length > 0;

                var time = performance.now();
                var delta = (time - prevTime) / 1000;

                velocity.x -= velocity.x * 8.0 * delta;
                velocity.z -= velocity.z * 8.0 * delta;
                velocity.y -= 9.8 * 70.0 * delta * 0.2;

                direction.z = Number(moveForward) - Number(moveBackward);
                direction.x = Number(moveLeft) - Number(moveRight);
                direction.normalize();

                if (moveForward || moveBackward) velocity.z -= direction.z * 80.0 * delta;
                if (moveLeft || moveRight) velocity.x -= direction.x * 80.0 * delta;

                if (onObject) {
                    velocity.y = Math.max(0, velocity.y);
                    canJump = true;
                }

                controls.getObject().translateX(velocity.x * delta);
                controls.getObject().translateY(velocity.y * delta);
                controls.getObject().translateZ(velocity.z * delta);

                if (controls.getObject().position.y < humanHeight) {
                    velocity.y = 0;
                    controls.getObject().position.y = humanHeight;

                    canJump = true;
                }

                prevTime = time;

            }

            camera.lookAt(new THREE.Vector3(0, 0, 0));

            send++;
            if (send % 10 === 0) {
                sendData();
            }

            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        }

        makeMeshes();
        setUpControls();
        setUpScene();

        animate();


        // ---------------------------------------- Load Objects -----------------------------------

        function loadObject(loader, url, texture, name) {
            loader.load(url, function (object) {
                object.traverse(function (child) {
                    if (child instanceof THREE.Mesh) {
                        if ((texture instanceof THREE.Texture)) {
                            child.material.map = texture;
                        } else {
                            child.material = texture;
                        }

                        child.material.side = THREE.DoubleSide;
                    }
                });
                objects[name] = object;
                if (name === "building" || name === "buildingWindow") {
                    object.position.y = -10;
                }
                scene.add(object);
            }, function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + "% loaded");
            }, function (error) {
                console.log("ERROR!: " + error)
            });
        }


        function sendData() {
            var object = controls.getObject();
            var lookAtVector = new THREE.Vector3(0, 0, -1);
            lookAtVector.applyQuaternion(camera.quaternion);

            var data = {
                user_id: id,
                positionX: object.position.x,
                positionY: object.position.y,
                positionZ: object.position.z,
                velocityX: velocity.x,
                velocityY: velocity.y,
                velocityZ: velocity.z,
                cameraLookAtX: lookAtVector.x,
                cameraLookAtY: lookAtVector.y,
                cameraLookAtZ: lookAtVector.z
            };

            $.ajax({
                type: "POST",
                url: "handleMe",
                json: true,
                data: data,
                success: function (data) {
                    console.log("It worked! Obtained data: " + JSON.stringify(data));

                    for (object of data) {

                        if (objects[object.user_id] == null) {
                            var texture = textureLoader.load('../images/textures/texture.png');
                            loadObject(loader, '../images/objects/human.obj', texture, object.user_id);

                        }
                        objects[object.user_id].position.x = object.positionX;
                        objects[object.user_id].position.y = object.positionY - humanHeight;
                        objects[object.user_id].position.z = object.positionZ;
                    }
                }
            });
        }


        // --------------------------------------- Add textures -------------------------------------


        // ------------------------ Controls -------------------------


        function setUpControls() {
            var onKeyDown = function (event) {
                switch (event.keyCode) {
                    case 38: // up
                    case 87: // w
                        moveForward = true;
                        break;
                    case 37: // left
                    case 65: // a
                        moveLeft = true;
                        break;
                    case 40: // down
                    case 83: // s
                        moveBackward = true;
                        break;
                    case 39: // right
                    case 68: // d
                        moveRight = true;
                        break;
                    case 32: // space
                        if (canJump === true) velocity.y += 30;
                        canJump = false;
                        break;
                }
            };
            var onKeyUp = function (event) {
                switch (event.keyCode) {
                    case 38: // up
                    case 87: // w
                        moveForward = false;
                        break;
                    case 37: // left
                    case 65: // a
                        moveLeft = false;
                        break;
                    case 40: // down
                    case 83: // s
                        moveBackward = false;
                        break;
                    case 39: // right
                    case 68: // d
                        moveRight = false;
                        break;
                }
            };

            document.addEventListener("keydown", onKeyDown, false);
            document.addEventListener("keyup", onKeyUp, false);

            var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
            if (havePointerLock) {
                var element = document.body;
                var pointerlockchange = function (event) {
                    if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
                        controls.enabled = true;
                    } else {
                        controls.enabled = false;
                    }
                };
                var pointerlockerror = function (event) {
                    console.log("error getting cursor: " + JSON.stringify(event));
                };
                document.addEventListener('pointerlockchange', pointerlockchange, false);
                document.addEventListener('mozpointerlockchange', pointerlockchange, false);
                document.addEventListener('webkitpointerlockchange', pointerlockchange, false);
                document.addEventListener('pointerlockerror', pointerlockerror, false);
                document.addEventListener('mozpointerlockerror', pointerlockerror, false);
                document.addEventListener('webkitpointerlockerror', pointerlockerror, false);

                document.addEventListener("click", function () {
                    element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
                    element.requestPointerLock();
                }, false);

            }
        }
    }
};