/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(['N/cache', 'N/ui/serverWidget', 'N/file'], function (cache, serverWidget, file) {
    function onRequest(context) {
        try {
            log.debug('context.request.method', context.request.method)
            if (context.request.method === 'GET') {
                // สร้างหน้าเพจใหม่
                var form = serverWidget.createForm({
                    // title: '3D Cube using Three.js with Container Switch (Demo)'
                    title: '3D Visualization'
                });

                // HTML field ที่จะฝังโค้ด HTML ของเรา | HTML field to embed our HTML code
                var htmlField = form.addField({
                    id: 'custpage_htmlfield',
                    type: serverWidget.FieldType.INLINEHTML,
                    label: '3D Shapes Example'
                });

                var myCache = cache.getCache({ name: 'MySuiteletCache', scope: cache.Scope.PUBLIC });
                var key = context.request.parameters.key;

                if (!key) {
                throw new Error('Missing cache key');
                }

                var cachedData = myCache.get({ key: key });

                log.debug('Key Received', key);
                log.debug('cachedData Received', cachedData);

                if (!cachedData) {
                    throw new Error('Cached data expired or not found');
                }

                var jsonResult3D = JSON.parse(cachedData);

                // Process the JSON data (e.g., store it in a custom record or render it dynamically)
                if (!jsonResult3D) {
                    context.response.write(JSON.stringify({ status: 'error', message: 'No 3D data received!' }));
                    return;
                }

                
                const containers = jsonResult3D.containers
                
                log.debug('containers', containers)
                containersData =   containers.map((container) =>{
                    const cont = container
                    cont.item =  container.coordinates3D
                    return cont
                })
                
                log.debug('containersData', containersData)
                
                var containerButtons = containersData.map((container, index) => `
                    <div class="container-box" onclick="changeContainer(${index})">
                        <h3>Container ${index + 1}</h3>
                        <div class="details" id="details-${index}" style="display: none;">
                        <p>Container Size: ${container.containerSize.width} x ${container.containerSize.height} x ${container.containerSize.length}</p>

                        ${(container.type === "Roll" || container.type === "CM Roll" || container.type === "wrapper") ? `
                            <p>Rolls: ${container.item ? container.rollsPerContainer || 0 : 0}</p>
                            <p>Rolls per Layer: ${container.item ? container.rollsPerLayer || 0 : 0}</p>
                            <p>Layer(s) of Roll: ${container.layersUsed ? container.layersUsed || 0 : 0}</p>
                            <p>Net Weight (TON): ${container.item ? container.containerNetWeight || 0.0 : 0.0}</p>
                            <p>Net Weight (KG): ${container.item ? container.containerNetWeightKG || 0.0 : 0.0}</p>
                            <p>Gross Weight (TON): ${container.item ? container.containerGrossWeight || 0.0 : 0.0}</p>
                            <p>Gross Weight (KG): ${container.item ? container.containerGrossWeightKG || 0.0 : 0.0}</p>

                            </br><h3>Item Recommendation</h3>
                            ${container.recommendedItems && Array.isArray(container.recommendedItems) && container.recommendedItems.length > 0 
                                ? "<ul>" + container.recommendedItems.map(function(item) {
                                    return "<li>" +
                                        "<strong>" + item.name + "</strong><br>" +
                                        "Max Pallet(s): " + (item.maxQuantity || "N/A") + "<br>" +
                                        (container.type === "Cutsize" ? "Layer: " + (item.layer || "N/A") + "<br>" + "<br>" : "<br>") + 
                                    "</li>";
                                }).join('') + "</ul>"
                                : "<p>None</p>"
                            }
                            
                
                        ` : ''}
                        
                        ${(container.type === "Roll" || container.type === "CM Roll" || container.type === "wrapper") ? `
                            ${container.item && Array.isArray(container.reams) && container.reams.some(reams => reams !== null) ? `<p>Reams: ${container.reams.join(", ")}</p>` : ""}
                            ${container.item && Array.isArray(container.boxes) && container.boxes.some(box => box !== null) ? `<p>Boxes: ${container.boxes.join(", ")}</p>` : ""}
                            <p>Pallets: ${container.item ? container.palletsPerContainer || 0 : 0}</p>
                            <p>Pallets per Layer: ${container.item ? container.palletsPerLayer || 0 : 0}</p>
                            <p>Layer(s) of Pallet: ${container.layersUsed ? container.layersUsed || 0 : 0}</p>
                            <p>Net Weight (TON): ${container.item ? container.containerNetWeight || 0.0 : 0.0}</p>
                            <p>Net Weight (KG): ${container.item ? container.containerNetWeightKG || 0.0 : 0.0}</p>
                            <p>Gross Weight (TON): ${container.item ? container.containerGrossWeight || 0.0 : 0.0}</p>
                            <p>Gross Weight (KG): ${container.item ? container.containerGrossWeightKG || 0.0 : 0.0}</p>

                            ${container.recommendedItems && Array.isArray(container.recommendedItems) && container.recommendedItems.length > 0 
                                ? `
                                    <h3>Item Recommendation</h3>
                                    <ul>
                                        ${container.recommendedItems.map(function(item) {
                                            return "<li>" +
                                                "<strong>" + (container.type === "Cutsize" ? (item.layer || "N/A") : (item.name || "N/A")) + "</strong><br>" +
                                                "Max Pallet(s): " + (item.maxQuantity || "N/A") + "<br><br>" +
                                            "</li>";
                                        }).join('')}
                                    </ul>
                                    
                                    ${container.type === "Cutsize" && container.sortedRecommendedItems && Array.isArray(container.sortedRecommendedItems) && container.sortedRecommendedItems.length > 0  
                                        ? `
                                            <h3>Item Options</h3>
                                            <ul>
                                                ${container.sortedRecommendedItems.map(item => `<li>${item.name}</li>`).join('')}
                                            </ul>
                                        ` : ''
                                    }
                                `
                                : ''
                            }
                            
                            
                        ` : ''}

                        
                        </br><h3>Product Details</h3>
                           <!--- ${container.item && container.item.length > 0 && container.item[container.item.length - 1].remainingDimensions
                                ? `<p>
                                    Remaining Dimension: 
                                    ${container.item[container.item.length - 1].remainingDimensions.width} x 
                                    ${container.item[container.item.length - 1].remainingDimensions.height} x 
                                    ${container.item[container.item.length - 1].remainingDimensions.length}
                                </p>`
                                : ''} --->
                            <ul>
                                ${container.item.map((item, j) => `
                                   <li>
                                   ${j + 1}
                                   <span class="color-box" style='background-color: ${item.color.startsWith('0x') ? item.color.replace('0x', '#') : item.color};'></span>
                                   ${item.type} : 
                                   ${item.displayName} : 
                                   <!-- ${item.productLayer} : --->
                                     ${(item.type === "Roll" || item.type === "CM Roll" || item.type === "wrapper")
                                        ? `${item.packedSize.diameter} x ${item.packedSize.width}` // ถ้าเป็น Roll ให้แสดงขนาดของ Roll | if it's Roll, show the size of the Roll
                                        : `${item.packedDimensions.width} x ${item.packedDimensions.height} x ${item.packedDimensions.length}`
                                    }  
                                    <!---   | XYZ: ${item.position.x}, ${item.position.y}, ${item.position.z} --->
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                `).join(''); // สร้างปุ่มสำหรับเปลี่ยน container และแสดงรายละเอียดของ container นั้นๆ | Create buttons to change container and show details of that container


                // ใส่ HTML และ Three.js script ลงในฟิลด์
                htmlField.defaultValue = `
                <style>
                    body {
                        display: flex;
                        font-family: Arial, sans-serif;
                    }
                     #container {
                        display: flex;
                        flex-direction: row;
                        width: 100%;
                        height: 100%;
                        margin: 20px;
                    }
                    #left-panel {
                        width: 50%;
                        background-color: #f0f0f0;
                        padding: 20px;
                    }
                    #right-panel {
                        width: 30%;
                        background-color: #f0f0f0;
                        padding: 20px;
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                    }
                    .container-box {
                        background-color: #ddd;
                        padding: 15px;
                        border: 1px solid #ccc;
                        cursor: pointer;
                    }
                    .color-box {
                      display: inline-block;
                      width: 12px;
                      height: 12px;
                      border: 1px solid #000;
                    }
                    canvas {
                        width: 100%;
                        height: 600px;
                    }
                </style>
                <div id="container">
                    <div id="left-panel">
                        <canvas id="shapeCanvas"></canvas>
                    </div>
                    <div id="right-panel">
                        ${containerButtons}
                    </div>
                </div>

                <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
                <script src="https://cdn.jsdelivr.net/gh/mrdoob/three.js@r134/examples/js/controls/OrbitControls.js"></script>
                <script>
                    try {   
                        var scene, camera, renderer, containerGroup,mainLight;
                        var containersData = ${JSON.stringify(containersData)};

                        function init() { 
                            scene = new THREE.Scene(); // สร้างฉาก | create a scene
                            camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 1000); // สร้างกล้องแบบ Perspective | create a Perspective camera
                            camera.position.set(-100, 0, 15); // ตำแหน่งของกล้อง | camera position

                            renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('shapeCanvas'), antialias: true }); // สร้าง renderer และกำหนดค่าต่างๆ | create renderer and set various values
                            renderer.setSize(window.innerWidth * 0.6, 600); // กำหนดขนาดของ renderer | set the size of the renderer
                            renderer.shadowMap.enabled = true; // ให้สามารถสร้างเงาได้ | create shadow
                            renderer.shadowMap.type = THREE.PCFSoftShadowMap; // ปรับค่าแผนที่เงาให้มีความละเอียดสูงขึ้น | adjust the shadow map to be more detailed
                            
                            var fillLight = new THREE.DirectionalLight(0xffffff, 0.5); // แสงเสริม หรือ แสงนุ่ม 
                            fillLight.position.set(-5, 5, 50);
                            fillLight.castShadow = false;
                            scene.add(fillLight);  
                            var helperfillLight = new THREE.DirectionalLightHelper(fillLight, 5);
                            scene.add(helperfillLight);   
                            
                            var ambientLight = new THREE.AmbientLight(0x404040, 2); // เพิ่มแสงนุ่มนวล
                            scene.add(ambientLight);
                            

                              // Create main light
                            mainLight = new THREE.DirectionalLight(0xffffff, 1);
                            mainLight.position.set(50, 20, 50); // เปลี่ยนตำแหน่งของแสงให้สูงขึ้น
                            mainLight.castShadow = true;
                        
                            // ปรับค่าขนาดของแผนที่เงาเพื่อให้มีความละเอียดสูงขึ้น
                            mainLight.shadow.mapSize.width = 2048;  // ปรับขนาดแผนที่เงา
                            mainLight.shadow.mapSize.height = 2048; // ปรับขนาดแผนที่เงา
                        
                            // ปรับค่าต่างๆ ของกล้องแสงเงา
                            mainLight.shadow.camera.near = 1;    // ตั้งค่าระยะใกล้
                            mainLight.shadow.camera.far = 1000;   // ตั้งค่าระยะไกล | set far distance
                            mainLight.shadow.camera.left = -50;  // กำหนดค่าตำแหน่งด้านซ้าย | set left position
                            mainLight.shadow.camera.right = 50;   // กำหนดค่าตำแหน่งด้านขวา | set right position
                            mainLight.shadow.camera.top = 50;     // กำหนดค่าตำแหน่งด้านบน | set top position
                            mainLight.shadow.camera.bottom = -50; // กำหนดค่าตำแหน่งด้านล่าง | set bottom position
                        
                            scene.add(mainLight);
                            
                            // remove this to view the light line
                            // var helper = new THREE.CameraHelper(mainLight.shadow.camera); // แสดงเส้นขอบของแสง | show the edges of the light
                            // scene.add(helper); 
                            
                            // var helper2 = new THREE.DirectionalLightHelper(mainLight); // แสดงเส้นขอบของแสง | show the edges of the light
                            // scene.add(helper2);

                            

                            var axesHelper = new THREE.AxesHelper(200);
                            scene.add(axesHelper);

                            var gridHelper = new THREE.GridHelper(100, 100);
                            scene.add(gridHelper);

                            containerGroup = new THREE.Group();
                            scene.add(containerGroup);

                            changeContainer(0); // set default container 0

                            var controls = new THREE.OrbitControls(camera, renderer.domElement);
                            controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
                            controls.dampingFactor = 0.25; // set damping 
                            controls.enableZoom = true; // ให้สามารถซูมได้

                            animate();
                        }

                        function changeContainer(containerId) {
                            while (containerGroup.children.length > 0) {
                                containerGroup.remove(containerGroup.children[0]); // ลบทุกอย่างออกจาก containerGroup ก่อน | remove everything from containerGroup first
                            }

                            var selectedContainer = containersData[containerId];
                          
                            selectedContainer.item.forEach(function(data) {
                                let type = data.type;                         
                                if (type === 'Roll' || type === 'roll' || type === 'CM Roll' || type === 'cm roll' || type === 'wrapper') {
                                    createRoll(data.packedSize.diameter/2, data.packedSize.width, data.color, data.position);
                                } else if (type === 'Cutsize' || type === 'cutsize') {
                                    createbox(data.packedDimensions.width, data.packedDimensions.height, data.packedDimensions.length, data.color, data.position);
                                } else if (type === 'Folio' || type === 'folio' || type === 'CM Sheet' || type === 'cm sheet' || type === 'honeycomb' || type === 'pulp' || type === 'box and cover' || type === 'double a office supply' || type === 'double a color paper') {
                                    createbox(data.packedDimensions.width, data.packedDimensions.height, data.packedDimensions.length, data.color, data.position);
                                } else if (type === 'Slipsheet' || type === 'slipsheet') {
                                    createbox(data.packedDimensions.width, data.packedDimensions.height, data.packedDimensions.length, data.color, data.position);
                                }
                            });

                            var containerWidth = selectedContainer.width;
                            var containerHeight = selectedContainer.height;
                            var containerDepth = selectedContainer.length;

                            var wallMaterial = new THREE.MeshPhongMaterial({ color: 0x888888, side: THREE.DoubleSide }); // สร้างสีของผนัง | create color of the wall
                            
                            // ตั้งตำแหน่งแสงให้มาจากทิศทาง 1 นาฬิกาโดยคำนวณตามขนาด container | set the light position to come from 1 o'clock by calculating according to the container size
                            var lightX = containerWidth * 0.5;  // ปรับค่า X ตามขนาดความกว้าง container | adjust X value according to the width of the container
                            var lightY = containerHeight * 1.5; // ปรับค่า Y ให้แสงสูงกว่าความสูงของ container | adjust Y value to be higher than the height of the container
                            var lightZ = containerDepth * 0.5;  // ปรับค่า Z ให้เหมือนทิศ 1 นาฬิกา | adjust Z value to be the same as 1 o'clock
                        
                            mainLight.position.set(lightX, lightY, lightZ);
                                                    
                          

                            var backWall = new THREE.Mesh(new THREE.PlaneGeometry(containerWidth, containerHeight), wallMaterial);
                            backWall.position.set(containerWidth / 2, containerHeight / 2, 0);
                            backWall.receiveShadow = true; // ให้สามารถรับแสงได้
                            containerGroup.add(backWall);

                            var bottomWall = new THREE.Mesh(new THREE.PlaneGeometry(containerWidth, containerDepth), wallMaterial);
                            bottomWall.rotation.x = Math.PI / 2;
                            bottomWall.position.set(containerWidth / 2, 0, containerDepth / 2);
                            bottomWall.receiveShadow = true; // ให้สามารถรับแสงได้
                            containerGroup.add(bottomWall);

                            var rightWall = new THREE.Mesh(new THREE.PlaneGeometry(containerDepth, containerHeight), wallMaterial);
                            rightWall.rotation.y = -Math.PI / 2;
                            rightWall.position.set(containerWidth, containerHeight / 2, containerDepth / 2);
                            rightWall.receiveShadow = true; // ให้สามารถรับแสงได้
                            containerGroup.add(rightWall);
                            

                            var details = document.getElementById('details-' + containerId); // แสดงรายละเอียดของ container ที่เลือก | show details of selected container
                            var allDetails = document.querySelectorAll('.details'); // ซ่อนรายละเอียดของ container ทั้งหมด | hide details of all containers
                            allDetails.forEach(detail => detail.style.display = 'none'); // ซ่อนรายละเอียดของ container ทั้งหมด | hide details of all containers
                            details.style.display = 'block'; // แสดงรายละเอียดของ container ที่เลือก | show details of selected container
                        }

                        function createRoll(radius, height, color, position) { 
                            var geometry = new THREE.CylinderGeometry(radius, radius, height, 32); // สร้างรูปทรงกระบอก | create a cylinder shape
                            var material = new THREE.MeshPhongMaterial({ color: parseInt(color, 16) }); // สร้างสีของกระบอก | create color of the cylinder
                            var cylinder = new THREE.Mesh(geometry, material); // สร้างกระบอก | create a cylinder
                            cylinder.position.set(position.x+radius, position.y + (height / 2), position.z+radius); // ตำแหน่งของกระบอก | position of the cylinder
                            cylinder.castShadow = true; // ให้สามารถสร้างเงาได้ | create shadow
                            cylinder.receiveShadow = true; // ให้สามารถรับแสงได้ | receive shadow
                            containerGroup.add(cylinder);
                            // Function to create a circular wireframe
                                function createCircle(radius, yPosition) { // สร้างวงกลม wireframe ที่อยู่บนกระบอก | create a circular wireframe on the cylinder
                                    var circleGeometry = new THREE.BufferGeometry();
                                    var circleVertices = [];
                                    
                                    for (let i = 0; i <= 32; i++) {
                                        let angle = (i / 32) * Math.PI * 2; // คำนวณมุมของแต่ละจุด
                                        let x = Math.cos(angle) * radius; // คำนวณค่า x ของจุด
                                        let z = Math.sin(angle) * radius; // คำนวณค่า z ของจุด
                                        circleVertices.push(x, yPosition, z);
                                    }
                                
                                    circleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(circleVertices, 3)); // กำหนดค่า position ของวงกลม | set position value of the circle
                                    var circleMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
                                    return new THREE.Line(circleGeometry, circleMaterial);
                                }
                                
                                // Add the top and bottom wireframe circles
                                var topCircle = createCircle(radius, height / 2); // สร้างวงกลมบน | create top circle
                                var bottomCircle = createCircle(radius, height / 2); // สร้างวงกลมล่าง | create bottom circle
                                
                                // Position the wireframes to match the cylinder
                                topCircle.position.copy(cylinder.position); 
                                bottomCircle.position.copy(cylinder.position);
                                
                                // Add the wireframes to the scene
                                containerGroup.add(topCircle);
                                containerGroup.add(bottomCircle);
                            
                        }

                        function createbox(width, height, length, color, position) {
                            var geometry = new THREE.BoxGeometry(width, height, length);
                            var material = new THREE.MeshStandardMaterial({ color: parseInt(color, 16) });
                            var box = new THREE.Mesh(geometry, material);
                            box.position.set(position.x+(width/2), position.y + (height / 2), position.z+(length/2));
                            box.castShadow = true;
                            box.receiveShadow = true;
                            containerGroup.add(box);
                            
                            var wireframe = new THREE.LineSegments(
                            new THREE.EdgesGeometry(geometry),
                            new THREE.LineBasicMaterial({ color: 0x000000 }) // Black wireframe
                            );
                            wireframe.position.copy(box.position);
                            containerGroup.add(wireframe);
                        }

                        function animate() {
                            requestAnimationFrame(animate);
                            renderer.render(scene, camera);
                        }

                        window.addEventListener('resize', function() { // ปรับขนาดของ renderer และ camera เมื่อมีการ resize หน้าจอ | adjust the size of the renderer and camera when the screen is resized
                            renderer.setSize(window.innerWidth * 0.6, 600);
                            camera.aspect = window.innerWidth / window.innerHeight;
                            camera.updateProjectionMatrix();
                        });

                        init();
                    } catch (error) {
                        console.error("An error occurred during initialization:", error);
                    }
                </script>
                `;

                context.response.writePage(form);

            }
            
        } catch (error) {
            log.error('Error in Suitelet', error.message);
        }
    }

    return {
        onRequest: onRequest
    };
});
