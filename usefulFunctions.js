async function AllImages(directory) {
    try {
        // Делаем запрос к директории
        let response = await fetch(directory);
        if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);

        // Получаем HTML-страницу с файлами
        let text = await response.text();
        let parser = new DOMParser();
        let doc = parser.parseFromString(text, "text/html");

        // Находим все ссылки (если сервер позволяет листинг)
        let links = [...doc.querySelectorAll("a")];

        return links
            .map(a => a.href) // Получаем абсолютные пути
            .filter(href => href.match(/\.(png|jpe?g|gif)$/i)) // Фильтруем изображения
            .map(href => new URL(href).pathname); // Приводим к относительному пути
    } catch (error) {
        console.error("Ошибка загрузки файлов:", error);
        return [];
    }
}

// AllImages("/dogs/images/Images/n02085620-Chihuahua/").then(console.log);

function measureExecutionTime(func) {
    const start = performance.now();  // Запоминаем начальное время
    func();  // Вызываем переданную функцию
    const end = performance.now();  // Запоминаем конечное время
    return end - start;  // Возвращаем разницу в миллисекундах
}

function renderGraph(data, canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas с id "${canvasId}" не найден!`);
        return;
    }
    const ctx = canvas.getContext('2d');

    // Очистим canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Определяем минимальное и максимальное значение для масштабирования
    //const min = Math.min(...data);
    const min = Math.min(0, Math.min(...data));
    const max = Math.max(...data);
    const range = max - min || 1; // чтобы избежать деления на 0

    // Определяем отступы от краев для графика
    const margin = 20;
    const graphWidth = canvas.width - margin * 2;
    const graphHeight = canvas.height - margin * 2;

    // Рисуем оси
    ctx.beginPath();
    ctx.strokeStyle = "#000";
    // Ось X
    ctx.moveTo(margin, canvas.height - margin);
    ctx.lineTo(canvas.width - margin, canvas.height - margin);
    // Ось Y
    ctx.moveTo(margin, canvas.height - margin);
    ctx.lineTo(margin, margin);
    ctx.stroke();

    // Рисуем график (линия)
    ctx.beginPath();
    ctx.strokeStyle = "blue";
    data.forEach((point, i) => {
        // Вычисляем координаты точки
        const x = margin + (i / (data.length - 1)) * graphWidth;
        // Для оси Y: нижняя точка = минимальное значение, верхняя = максимальное значение
        const y = canvas.height - margin - ((point - min) / range) * graphHeight;
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();

    // Рисуем точки на графике (опционально)
    ctx.fillStyle = "red";
    data.forEach((point, i) => {
        const x = margin + (i / (data.length - 1)) * graphWidth;
        const y = canvas.height - margin - ((point - min) / range) * graphHeight;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
    });
}

function smoothData(data, epochLength) {
    const smoothedData = [];
    
    // Проходим по данным, разбивая их на блоки
    for (let i = 0; i < data.length; i += epochLength) {
        // Берем блок данных длиной epochLength
        const block = data.slice(i, i + epochLength);
        
        // Вычисляем среднее для этого блока
        const average = block.reduce((sum, value) => sum + value, 0) / block.length;
        
        // Добавляем среднее значение блока в результат
        smoothedData.push(average);
    }

    return smoothedData;
}