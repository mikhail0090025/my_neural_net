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