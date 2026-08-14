const tg = window.Telegram.WebApp;
tg.ready();

const usernameInput = document.getElementById('username');
const runBtn = document.getElementById('runBtn');
const loader = document.getElementById('loader');
const resultDiv = document.getElementById('result');
const profileData = document.getElementById('profileData');
const downloadBtn = document.getElementById('downloadBtn');

let lastData = null;

runBtn.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    if (!username) return alert('Введите юзернейм');

    loader.classList.remove('hidden');
    resultDiv.classList.add('hidden');
    profileData.textContent = '';

    // Отправляем запрос боту через WebApp
    tg.sendData(JSON.stringify({
        action: 'osint',
        username: username
    }));

    // Ждём ответ от бота (он придёт через sendData / callback)
    // В реальном Mini App ответ приходит либо в чат, либо через метод mainButton.
    // Для демо — симулируем через 3 секунды.
    setTimeout(() => {
        loader.classList.add('hidden');
        resultDiv.classList.remove('hidden');
        // В реальности данные придут от бота, здесь пример:
        const mockData = {
            username: username,
            id: 123456789,
            first_name: 'Иван',
            last_name: 'Петров',
            phone: '+7 999 123-45-67',
            bio: 'Люблю OSINT и кофе',
            emails: ['ivan@mail.ru'],
            passport_data: { inn_ru: '123456789012' },
            messages_count: 342,
            groups: ['IT-чат', 'Python разработчики']
        };
        displayData(mockData);
        lastData = mockData;
    }, 2500);
});

function displayData(data) {
    profileData.textContent = JSON.stringify(data, null, 2);
}

downloadBtn.addEventListener('click', () => {
    if (!lastData) return;
    const blob = new Blob([JSON.stringify(lastData, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dossier_${lastData.username}.json`;
    a.click();
    URL.revokeObjectURL(url);
});