import os
import pymysql
import schedule
import time
from datetime import datetime
from flask import Flask, render_template, jsonify, send_from_directory
from threading import Thread
from flask_caching import Cache
from sqlalchemy import text, func
from dotenv import load_dotenv

load_dotenv()

# Configurações do MySQL
HOST = os.environ.get('SERVER')
DATABASE = os.environ.get('DATABASE')
USERNAME = os.environ.get('DB_USERNAME')
PASSWORD = os.environ.get('DB_PASSWORD')

app = Flask(__name__, static_url_path='/static')

# Configuração do Flask-Caching
cache = Cache(app, config={'CACHE_TYPE': 'simple'})

def conectar_mysql():
    return pymysql.connect(
        host=HOST,
        user=USERNAME,
        password=PASSWORD,
        database=DATABASE,
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )

@cache.memoize(timeout=60)
def obter_contagens():
    conn = conectar_mysql()
    cursor = conn.cursor()
    queries = {
        'pedidos_entregar': """
        SELECT COUNT(*) AS count
        FROM dbo.VIEW_PB_Pedidos
        WHERE (ES = 'S')
        AND (Ped_Status <> 'Baixado' OR Ped_Status IS NULL)
        AND (Transportadora = 'O PROPRIO *')
        AND (Ped_Status <> 'Saida' OR Ped_Status IS NULL)
        AND (Ped_Status <> 'Pedido' OR Ped_Status IS NULL)
        """,
        'transportadoras_atrasadas': """
        SELECT COUNT(*) AS count
        FROM dbo.VIEW_PB_Pedidos
        WHERE (ES = 'S')
        AND (Ped_Status <> 'Baixado' OR Ped_Status IS NULL)
        AND (Ped_Status <> 'Saida' OR Ped_Status IS NULL)
        AND (Ped_Status <> 'Pedido' OR Ped_Status IS NULL)
        AND (DATE_ADD(Ped_Data, INTERVAL 3 DAY) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY))
        AND (DATE_ADD(Ped_Data, INTERVAL 3 DAY) < DATE_ADD(CURDATE(), INTERVAL 1 DAY))
        AND (Cli_Nome <> 'FUNCIONARIOS DA ELMAR ME' OR Cli_Nome IS NULL)
        AND (Transportadora <> 'O PROPRIO')
        AND (DATE_ADD(ColetaDt, INTERVAL 3 DAY) >= DATE_SUB(CURDATE(), INTERVAL 20 DAY))
        AND (DATE_ADD(ColetaDt, INTERVAL 3 DAY) < DATE_ADD(CURDATE(), INTERVAL 1 DAY))
        """,
        'pedidos_retirar': """
        SELECT COUNT(*) AS count
        FROM dbo.VIEW_PB_Pedidos
        WHERE (ES = 'S')
        AND (Ped_Status <> 'Baixado' OR Ped_Status IS NULL)
        AND (Transportadora = 'O PROPRIO (Balcao)' OR Transportadora = 'O PROPRIO')
        AND (Ped_Status <> 'Saida' OR Ped_Status IS NULL)
        AND (Ped_Status <> 'Pedido' OR Ped_Status IS NULL)
        AND (Cli_Nome <> 'FUNCIONARIOS DA ELMAR ME' OR Cli_Nome IS NULL)
        """,
        'transportadoras_total': """
        SELECT COUNT(*) AS count
        FROM dbo.VIEW_PB_Pedidos
        WHERE (ES = 'S')
        AND (Ped_Status <> 'Baixado' OR Ped_Status IS NULL)
        AND (Transportadora NOT IN ('O Proprio', 'O PROPRIO (Balcao)', 'CLEVERTON PROPLASTIK', 'CORREIOS PAC', 'O PROPRIO *') OR Transportadora IS NULL)
        AND (Ped_Status <> 'Saida' OR Ped_Status IS NULL)
        AND (Ped_Status <> 'Pedido' OR Ped_Status IS NULL)
        """
    }

    resultados = {}
    for nome, query in queries.items():
        cursor.execute(query)
        resultados[nome] = cursor.fetchone()['count']
    conn.close()
    return resultados

@cache.memoize(timeout=60)
def obter_pedidos_entregar():
    conn = conectar_mysql()
    cursor = conn.cursor()
    query = """
    SELECT Pedido AS numero, Cli_Nome AS cliente, 
           DATE_FORMAT(Ped_Data, '%d/%m/%Y') AS data, Ped_Status AS status
    FROM dbo.VIEW_PB_Pedidos
    WHERE (ES = 'S')
    AND (Ped_Status <> 'Baixado' OR Ped_Status IS NULL)
    AND (Transportadora = 'O PROPRIO *')
    AND (Ped_Status <> 'Saida' OR Ped_Status IS NULL)
    AND (Ped_Status <> 'Pedido' OR Ped_Status IS NULL)
    ORDER BY Ped_Data DESC
    LIMIT 10
    """
    cursor.execute(query)
    resultados = cursor.fetchall()
    conn.close()
    return resultados

@cache.memoize(timeout=60)
def obter_transportadoras_atrasadas():
    conn = conectar_mysql()
    cursor = conn.cursor()
    query = """
    SELECT Transportadora AS nome, Cli_Nome AS cliente, 
           DATE_FORMAT(DATE_ADD(Ped_Data, INTERVAL 3 DAY), '%d/%m/%Y') AS data_prevista, 
           DATEDIFF(CURDATE(), DATE_ADD(Ped_Data, INTERVAL 3 DAY)) AS dias_atraso
    FROM dbo.VIEW_PB_Pedidos
    WHERE (ES = 'S')
    AND (Ped_Status <> 'Baixado' OR Ped_Status IS NULL)
    AND (Ped_Status <> 'Saida' OR Ped_Status IS NULL)
    AND (Ped_Status <> 'Pedido' OR Ped_Status IS NULL)
    AND (DATE_ADD(Ped_Data, INTERVAL 3 DAY) < CURDATE())
    AND (Cli_Nome <> 'FUNCIONARIOS DA ELMAR ME' OR Cli_Nome IS NULL)
    AND (Transportadora <> 'O PROPRIO')
    ORDER BY dias_atraso DESC
    LIMIT 10
    """
    cursor.execute(query)
    resultados = cursor.fetchall()
    conn.close()
    return resultados

def job():
    print(f"Atualizando contagens... {datetime.now()}")
    cache.delete_memoized(obter_contagens)
    cache.delete_memoized(obter_pedidos_entregar)
    cache.delete_memoized(obter_transportadoras_atrasadas)
    return obter_contagens()

@app.route('/')
@cache.cached(timeout=30)
def dashboard():
    contagens = obter_contagens()
    pedidos_entregar = obter_pedidos_entregar()
    transportadoras_atrasadas = obter_transportadoras_atrasadas()
    return render_template('index.html', contagens=contagens, pedidos_entregar=pedidos_entregar, transportadoras_atrasadas=transportadoras_atrasadas)

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

@app.route('/styles.css')
def serve_css():
    return send_from_directory('.', 'styles.css')

@app.route('/get_updated_data')
def get_updated_data():
    contagens = obter_contagens()
    pedidos_entregar = obter_pedidos_entregar()
    transportadoras_atrasadas = obter_transportadoras_atrasadas()
    return jsonify({
        'contagens': contagens,
        'pedidos_entregar': pedidos_entregar,
        'transportadoras_atrasadas': transportadoras_atrasadas
    })

def run_schedule():
    while True:
        schedule.run_pending()
        time.sleep(1)

if __name__ == '__main__':
    schedule.every(30).seconds.do(job)
    # Executar a primeira verificação imediatamente
    job()
    # Iniciar o agendador em uma thread separada
    thread = Thread(target=run_schedule)
    thread.start()
    # Iniciar o servidor Flask
    app.run(host='0.0.0.0', port=5002, debug=True, use_reloader=False)
