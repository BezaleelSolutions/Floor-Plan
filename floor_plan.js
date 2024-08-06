

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            fetchFloors().then(floors => {
                buildTabs(floors);
                buildTabContent(floors);
                initDraggable();
            });
        });

        async function fetchFloors() {
            // Fetch floors data from the API
            const response = await fetch('your-api-endpoint/floors');
            const data = await response.json();
            return data;
        }

        async function fetchTables(floorId) {
            // Fetch tables data from the API for a specific floor
            const response = await fetch(`your-api-endpoint/tables?floor_id=${floorId}`);
            const data = await response.json();
            return data;
        }

        async function fetchBlocks(floorId) {
            // Fetch blocks data from the API for a specific floor
            const response = await fetch(`your-api-endpoint/blocks?floor_id=${floorId}`);
            const data = await response.json();
            return data;
        }

        function buildTabs(floors) {
            const tabsContainer = document.getElementById('floor-plan-tabs');
            floors.forEach((floor, index) => {
                const activeClass = (index === 0) ? 'active' : '';
                const tab = `<li class="${activeClass}"><a onclick="changeTab();" data-toggle="tab" href="#floor-${floor.floor_id}">${floor.floor_title}</a></li>`;
                tabsContainer.insertAdjacentHTML('beforeend', tab);
            });
        }

        async function buildTabContent(floors) {
            const tabContentContainer = document.getElementById('tab-content');
            for (const [index, floor] of floors.entries()) {
                const tables = await fetchTables(floor.floor_id);
                const blocks = await fetchBlocks(floor.floor_id);
                const activeClass = (index === 0) ? 'in active' : '';
                let minHeight = floor.floor_height;

                // Calculate min height based on tables' positions
                if (tables.length > 0) {
                    const maxTopPosition = Math.max(...tables.map(table => table.position_y));
                    if (maxTopPosition > minHeight) {
                        minHeight = maxTopPosition + 200;
                    }
                }

                let content = `<div id="floor-${floor.floor_id}" class="tab-pane fade ${activeClass}" style="width:${floor.floor_width}px;height:auto;position: relative;background: #333;border-radius: 10px;padding:20px;z-index: 2;min-height: ${minHeight}px;">`;
                content += buildToolsMenu(floor.floor_id);

                // Add blocks
                blocks.forEach((block, j) => {
                    content += buildBlock(block, j);
                });

                // Add tables
                tables.forEach((table, i) => {
                    content += buildTable(table, i);
                });

                content += '</div>';
                tabContentContainer.insertAdjacentHTML('beforeend', content);
            }
        }

        function buildToolsMenu(floorId) {
            return `
                <div class="dropdown text-center" style="width:30px;height:30px;border-radius: 50%;background: none;position: fixed;right:30px;top:100px;z-index: 3;">
                    <a class="dropdown-toggle" data-toggle="dropdown" style="color:#fff;">
                        <nobr><i style="color:#fff;" class="fa fa-gear"></i> <span class="hidden-sm">Tools</span></nobr>
                    </a>
                    <ul class="dropdown-menu" role="menu" aria-labelledby="menu1" style="top:-0px !important;left: -200px !important;z-index:3">
                        <li role="presentation"><a onclick="addBlock();">Add Block</a></li>
                        <li role="presentation"><a onclick="addTable();">Add Table</a></li>
                        <li role="presentation"><a onclick="rearrangeTables(${floorId});">Re-arrange Tables</a></li>
                        <li role="presentation"><a onclick="clearTables(${floorId});">Delete All Tables</a></li>
                        <li role="presentation"><a onclick="editFloor(${floorId});">Edit Floor</a></li>
                        <li role="presentation"><a onclick="deleteFloor(${floorId});">Delete Floor</a></li>
                        <li role="presentation"><a onclick="restoreTables();">Restore Default Tables</a></li>
                    </ul>
                </div>
            `;
        }

        function buildBlock(block, index) {
            return `
                <div id="block-${block.block_id}" class="draggable-block draggable" style="width:${block.width}px; height:${block.height}px;position: absolute;left:${block.position_x || (index * 20)}px;top:${block.position_y || (index * 20)}px;background:${block.bg_color};">
                    <div class="dropdown text-center" style="width:30px;height:30px;border-radius: 50%;background: red;position: absolute;right:-16px;top:-17px;z-index: 2;">
                        <a class="dropdown-toggle" data-toggle="dropdown">
                            <i style="font-size: 30px;color:#fff;" class="fa fa-ellipsis-h"></i>
                        </a>
                        <ul class="dropdown-menu" role="menu" aria-labelledby="menu1" style="top:-0px !important;left: -80px !important;z-index:3">
                            <li role="presentation"><a onclick="editBlock(${block.block_id});">Edit</a></li>
                            <li role="presentation"><a onclick="deleteBlock(${block.block_id},${block.floor_id});">Delete</a></li>
                        </ul>
                    </div>
                    <span style="width:150px;transform: rotate(-90deg);position: absolute;left: -85px;top:40%;font-size:14px;"> <nobr>${block.block_title}</nobr></span>
                </div>
            `;
        }

        function buildTable(table, index) {
            const chairs = table.chairs > 2 ? table.chairs : 2;
            const horizontal = table.verticle_or_horizontal === 1 ? 0 : 1;
            let tableHeight = 30;
            if (chairs > 2) tableHeight += 25;

            let tableHTML = `
                <div id="table-${table.table_id}" class="draggable-table parent-div draggable" style="height:1px;padding:0;margin:0;position: ${table.position_x > 0 ? 'absolute;' : 'relative;margin:15px;'}${table.position_x > 0 ? 'left:' + table.position_x + 'px;' : ''}${table.position_x > 0 ? 'top:' + table.position_y + 'px;' : ''}">
                    <div class="dropdown">
                        <a class="dropdown-toggle" data-toggle="dropdown" id="">
                            ${buildTableChairs(chairs, horizontal, tableHeight)}
                            <div style="background:#fff;border:3px solid #bbb;width:${horizontal ? tableHeight : 65}px;height:${horizontal ? 65 : tableHeight}px;border-radius:20px;position: absolute;top:${horizontal && chairs == 2 ? -2 : 13}px;left:${!horizontal && chairs == 2 ? -2 : 13}px;text-align: center;display: flex;justify-content: center;align-items: center;">
                                <small style="margin:auto;display:inline-block;vertical-align: middle;">${table.table_title}</small>
                            </div>
                        </a>
                        <ul class="dropdown-menu" role="menu" aria-labelledby="menu1" style="top:-0px !important;left: -40px !important">
                            <li role="presentation"><a style="font-size:13px;">Table Name: <b style="color:red;">${table.table_title}</b></a></li>
                            <hr>
                            <li role="presentation"><a onclick="editTable(${table.table_id});" style="font-size:20px;">Edit</a></li>
                            <li role="presentation"><a onclick="deleteTable(${table.table_id},${table.floor_id})" style="font-size:20px;cursor: pointer;">Delete</a></li>
                        </ul>
                    </div>
                </div>
            `;
            return tableHTML;
        }

        function buildTableChairs(chairs, horizontal, tableHeight) {
            let chairsHTML = '';
            const sideChairs = chairs > 2 ? (chairs % 2 === 0 ? chairs - 2 : chairs - 1) : chairs;

            if (chairs > 2) {
                chairsHTML += horizontal ? `
                    <div style="height: 90px;width: 27px;display: inline-block;float:left;">
                        <div class="chairs" style="height: 90px;width:27px;float:left;display:flex;align-items:center;">
                            <div class="left-chair-shape"><div class="left-chair-1"></div><div class="left-chair-2" style="width:22px;"></div></div>
                        </div>
                    </div>
                ` : `
                    <center>
                        <div class="chairs">
                            <div class="first-chair-shape"><div class="first-chair-1"></div><br><div class="first-chair-2"></div></div>
                        </div>
                    </center>
                `;
            }

            for (let x = 1; x <= sideChairs; x += 2) {
                if (chairs > 2) tableHeight += 25;
                chairsHTML += horizontal ? `
                    <div class="chairs" style="display: inline-block;width:auto;float:left;">
                        <div class="first-chair-shape"><div class="first-chair-1"></div><br><div class="first-chair-2" style="height: 40px;"></div></div>
                        <div class="last-chair-shape"><div class="last-chair-1" style="height: 40px;"></div><br><div class="last-chair-2"></div></div>
                    </div>
                ` : `
                    <div class="chairs">
                        <div class="right-chair-shape"><div class="right-chair-1"></div><div class="right-chair-2"></div></div>
                        <div class="left-chair-shape"><div class="left-chair-1"></div><div class="left-chair-2"></div></div>
                    </div>
                `;
            }

            if (chairs > 3 && chairs % 2 === 0) {
                chairsHTML += horizontal ? `
                    <div style="height: 90px;width: 27px;display: inline-block;float:right;">
                        <div class="chairs" style="height: 90px;width:27px;float:right;display:flex;align-items:center;">
                            <div class="right-chair-shape"><div class="right-chair-1" style="width:22px;"></div><div class="right-chair-2"></div></div>
                        </div>
                    </div>
                ` : `
                    <center>
                        <div class="chairs">
                            <div class="last-chair-shape"><div class="last-chair-1"></div><br><div class="last-chair-2"></div></div>
                        </div>
                    </center>
                `;
            }

            return chairsHTML;
        }

        function changeTab() {
            saveTablesPosition();
        }

        function saveTablesPosition() {
            const activeTab = document.querySelector('.tab-pane.active');
            const tables = activeTab.querySelectorAll('.draggable-table');
            tables.forEach(table => {
                const x = table.offsetLeft;
                const y = table.offsetTop;
                const id = table.id;

                fetch('your-api-endpoint/save-table-position', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ x, y, id })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status !== 'ok') {
                        alert('Error on Saving');
                    }
                })
                .catch(error => {
                    alert('Error on Saving');
                });
            });
        }

        function initDraggable() {
            setTimeout(() => {
                $('.draggable').draggable({
                    cursor: 'move',
                    containment: '.tab-content'
                });
                $(".tab-content").droppable({
                    drop: function(event, ui) {
                        const offsetXPos = parseInt(ui.draggable.position().left);
                        const offsetYPos = parseInt(ui.draggable.position().top);
                        const id = ui.draggable.prop('id');
                        fetch('your-api-endpoint/save-table-position', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ x: offsetXPos, y: offsetYPos, id })
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.status !== 'ok') {
                                alert('Error on Saving');
                            }
                        })
                        .catch(error => {
                            alert('Error on Saving');
                        });
                    }
                });
                saveTablesPosition();
            }, 500);
        }
    </script>

