document.addEventListener('DOMContentLoaded', () => {
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    
    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            if (document.documentElement.requestFullscreen) { // Verifica se a API de tela cheia é suportada
                document.documentElement.requestFullscreen();
            } else if (document.documentElement.mozRequestFullScreen) { // Firefox
                document.documentElement.mozRequestFullScreen();
            } else if (document.documentElement.webkitRequestFullscreen) { // Chrome, Safari e Opera
                document.documentElement.webkitRequestFullscreen();
            } else if (document.documentElement.msRequestFullscreen) { // Internet Explorer/Edge
                document.documentElement.msRequestFullscreen();
            }
            fullscreenBtn.textContent = 'Sair da Tela Cheia'; // Atualiza o texto do botão
        } else {
            if (document.exitFullscreen) { // Verifica se a API de saída de tela cheia é suportada
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) { // Firefox
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) { // Chrome, Safari e Opera
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { // Internet Explorer/Edge
                document.msExitFullscreen();
            }
            fullscreenBtn.textContent = 'Tela Cheia';
        }
    });

    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            fullscreenBtn.textContent = 'Tela Cheia';
        }
    });
});
