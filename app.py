from flask import Flask, render_template
import os

app = Flask(__name__, static_folder='static', template_folder='templates')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/services')
def services():
    return render_template('services.html')

@app.route('/gallery')
def gallery():
    return render_template('gallery.html')

@app.route('/booking')
def booking():
    return render_template('booking.html')

# Compatibilidad con rutas .html directas
@app.route('/index.html')
def index_html():
    return render_template('index.html')

@app.route('/services.html')
def services_html():
    return render_template('services.html')

@app.route('/gallery.html')
def gallery_html():
    return render_template('gallery.html')

@app.route('/booking.html')
def booking_html():
    return render_template('booking.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') != 'production'
    app.run(host='0.0.0.0', port=port, debug=debug)

