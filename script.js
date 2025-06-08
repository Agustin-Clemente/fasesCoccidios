const items = [
            { id: 'esporozoito', text: 'Esporozoito', category: 'asexual' },
            { id: 'merozoitos', text: 'Merozoitos', category: 'asexual' },
            { id: 'trofozoito', text: 'Trofozoito', category: 'asexual' },
            { id: 'esquizonte-1', text: 'Esquizonte de 1ª gen', category: 'asexual' },
            { id: 'esquizonte-2', text: 'Esquizonte de 2ª gen', category: 'asexual' },
            { id: 'microgamonte', text: 'Microgamonte', category: 'sexual' },
            { id: 'macrogametos', text: 'Macrogametos', category: 'sexual' },
            { id: 'microgametos', text: 'Microgametos', category: 'sexual' },
            { id: 'ooquiste-inmaduro', text: 'Ooquiste inmaduro', category: 'sexual' },
            { id: 'cigoto', text: 'Cigoto', category: 'sexual' }
        ];

        // Elementos DOM
        const asexualDropZone = document.getElementById('asexual-drop-zone');
        const sexualDropZone = document.getElementById('sexual-drop-zone');
        const dragItemsContainer = document.getElementById('drag-items-container');
        const messageBox = document.getElementById('message-box');
        const resetButton = document.getElementById('reset-button');

        let draggedItem = null; // Almacena el elemento que se está arrastrando
        let initialParent = null; // Almacena el padre inicial del elemento arrastrado

        // Función para mostrar mensajes en la caja de mensajes
        function showMessage(msg, duration = 1500) {
            messageBox.textContent = msg;
            messageBox.classList.add('show');
            setTimeout(() => {
                messageBox.classList.remove('show');
            }, duration);
        }

        function initializeDragItems() {
            asexualDropZone.querySelectorAll('.drag-item').forEach(item => dragItemsContainer.appendChild(item));
            sexualDropZone.querySelectorAll('.drag-item').forEach(item => dragItemsContainer.appendChild(item));
            dragItemsContainer.innerHTML = '';

            const shuffledItems = [...items].sort(() => Math.random() - 0.5);

            shuffledItems.forEach(itemData => {
                const item = document.createElement('div');
                item.className = 'drag-item';
                item.id = itemData.id;
                item.textContent = itemData.text;
                item.setAttribute('draggable', 'true');
                item.dataset.category = itemData.category; 

                item.addEventListener('dragstart', (e) => {
                    draggedItem = item;
                    initialParent = item.parentNode;
                    e.dataTransfer.setData('text/plain', item.id);
                    // Añadir un pequeño retraso para asegurar que el estilo de arrastre no se aplique demasiado pronto
                    setTimeout(() => {
                        item.classList.add('opacity-50'); // Ocultar el elemento original mientras se arrastra
                    }, 0);
                });

                item.addEventListener('dragend', () => {
                    item.classList.remove('opacity-50'); // Mostrar el elemento de nuevo
                    draggedItem = null;
                    initialParent = null;
                });

                // Eventos de arrastre para dispositivos táctiles
                item.addEventListener('touchstart', (e) => {
                    draggedItem = item;
                    initialParent = item.parentNode;
                    item.style.position = 'absolute';
                    item.style.zIndex = 1000;
                    const touch = e.touches[0];
                    const offsetX = touch.clientX - item.getBoundingClientRect().left;
                    const offsetY = touch.clientY - item.getBoundingClientRect().top;

                    const moveHandler = (e) => {
                        e.preventDefault(); // Prevenir el desplazamiento de la página
                        const touch = e.touches[0];
                        item.style.left = `${touch.clientX - offsetX}px`;
                        item.style.top = `${touch.clientY - offsetY}px`;
                    };

                    const endHandler = (e) => {
                        item.removeEventListener('touchmove', moveHandler);
                        item.removeEventListener('touchend', endHandler);
                        item.removeEventListener('touchcancel', endHandler);

                        item.style.position = ''; // Restablecer posición
                        item.style.zIndex = ''; // Restablecer z-index

                        // Determinar la zona de suelta basándose en las coordenadas del touch
                        const finalTouch = e.changedTouches[0];
                        const targetElement = document.elementFromPoint(finalTouch.clientX, finalTouch.clientY);

                        let droppedIntoZone = null;
                        if (asexualDropZone.contains(targetElement) || targetElement === asexualDropZone) {
                            droppedIntoZone = asexualDropZone;
                        } else if (sexualDropZone.contains(targetElement) || targetElement === sexualDropZone) {
                            droppedIntoZone = sexualDropZone;
                        }

                        if (droppedIntoZone) {
                            handleDrop(droppedIntoZone, item);
                        } else {
                            // Si se soltó fuera de una zona, devolver al contenedor original o a su posición inicial
                            if (initialParent) {
                                initialParent.appendChild(item);
                            } else {
                                dragItemsContainer.appendChild(item); // O alguna posición predeterminada si no había padre inicial
                            }
                        }
                        draggedItem = null;
                        initialParent = null;
                    };

                    item.addEventListener('touchmove', moveHandler, { passive: false });
                    item.addEventListener('touchend', endHandler);
                    item.addEventListener('touchcancel', endHandler);
                }, { passive: false }); // Usar passive: false para permitir preventDefault

                dragItemsContainer.appendChild(item);
            });
        }

        // Configurar zonas de arrastre
        [asexualDropZone, sexualDropZone].forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault(); // Permitir la caída
                e.dataTransfer.dropEffect = 'move';
            });

            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                handleDrop(zone, draggedItem);
            });
        });

        // Manejador de la lógica de soltar
        function handleDrop(zone, item) {
            if (!item) return;

            const correctCategory = item.dataset.category;
            const droppedZoneId = zone.id.replace('-drop-zone', ''); // asexual o sexual

            if (correctCategory === droppedZoneId) {
                zone.appendChild(item);
                item.classList.add('correct');
                item.setAttribute('draggable', 'false'); // Ya no se puede arrastrar una vez que es correcto
                showMessage('¡Correcto!');
            } else {
                showMessage('¡Incorrecto! Intenta de nuevo.');
                // Regresar el elemento a su contenedor original si existe
                if (initialParent) {
                    initialParent.appendChild(item);
                } else {
                    dragItemsContainer.appendChild(item);
                }
            }
            checkWinCondition();
        }

        // Función para verificar si todos los elementos están en su lugar
        function checkWinCondition() {
            const allCorrect = items.every(itemData => {
                const itemElement = document.getElementById(itemData.id);
                return itemElement && itemElement.classList.contains('correct');
            });

            if (allCorrect) {
                showMessage('¡Felicidades! Has completado el ciclo biológico.', 3000);
            }
        }

        // Event listener para el botón de reiniciar
        resetButton.addEventListener('click', () => {
            items.forEach(itemData => {
                const itemElement = document.getElementById(itemData.id);
                if (itemElement) {
                    itemElement.classList.remove('correct');
                    itemElement.setAttribute('draggable', 'true'); // Hacer arrastrable de nuevo
                }
            });
            initializeDragItems();
            showMessage('Juego Reiniciado.');
        });

       
        document.addEventListener('DOMContentLoaded', initializeDragItems);