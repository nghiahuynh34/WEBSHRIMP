from io import BytesIO
from urllib.parse import urlparse

from flask import Flask, render_template, request, redirect, jsonify, Response, url_for, session, abort
from flask_cors import CORS
import os
from ultralytics import YOLO
from werkzeug.utils import secure_filename
from authlib.integrations.flask_client import OAuth
from flask_mysqldb import MySQL
from flask_login import (
    logout_user,
)
import my_YoloV8
import json
import cv2
import random
import imghdr
import requests


# from random import random
# Khởi tạo Flask Server Backend
app = Flask(__name__)
ALLOWED_EXTENSIONS = set(['png', 'jpg', 'jpeg', 'gif', 'mp4'])
# Apply Flask CORS
CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'
app.config['UPLOAD_FOLDER'] = "static"


# app.secret_key = 'dhbsfbsdbc8223bd'
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = '12345678'
app.config['MYSQL_DB'] = 'yolov8shrimp'
mysql = MySQL(app)

model = my_YoloV8.YOLOv8_ObjectCounter(model_file="best1686.pt")

appConf = {
    "OAUTH2_CLIENT_ID": "791126823139-piql3f0tr6ig8l0afd2guaro6td57tal.apps.googleusercontent.com",
    "OAUTH2_CLIENT_SECRET": "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",
    "OAUTH2_META_URL": "https://accounts.google.com/.well-known/openid-configuration",
    "FLASK_SECRET": "432dc545-07c7-4470-aba0-818d7a9cf3db",
    "FLASK_PORT": 5000
}

app.secret_key = appConf.get("FLASK_SECRET")

oauth = OAuth(app)
# list of google scopes - https://developers.google.com/identity/protocols/oauth2/scopes
oauth.register(
    "myApp",
    client_id=appConf.get("OAUTH2_CLIENT_ID"),
    client_secret=appConf.get("OAUTH2_CLIENT_SECRET"),
    client_kwargs={
        "scope": "openid profile email https://www.googleapis.com/auth/user.birthday.read https://www.googleapis.com/auth/user.gender.read",
        # 'code_challenge_method': 'S256'  # enable PKCE
    },
    server_metadata_url=f'{appConf.get("OAUTH2_META_URL")}',
)


@app.route("/")
def home():   
    if (session):
           
        # print(session)
        CS = mysql.connection.cursor()
        print(session["user"]["email"])
        CS.execute(f"""SELECT * FROM user where email='{session["user"]["email"]}'""")
        Executed_DATA = CS.fetchall()
        print("Executed_DATA",session["provider"])
        if (Executed_DATA):
            return render_template("home.html", session=Executed_DATA)
        elif(session["provider"] == "Google"):
            CS.execute(
                f"""INSERT INTO user VALUES ('{session["user"]["email"]}','{session["user"]["name"]}','{session["user"]["picture"]}','{session["user"]["picture"]}+{session["user"]["email"]}')""")
            # CS.execute('''INSERT INTO TABLE_NAME VALUES (2, 'Arthor')''')
            mysql.connection.commit()
            CS.execute(f"""SELECT * FROM user where email='{session["user"]["email"]}'""")
            Executed_DATA = CS.fetchall()
            print("okokoko",Executed_DATA)
            return render_template("home.html", session=Executed_DATA
                               )
    else:
        print("no")
        return render_template("home.html", session="")

@app.route("/signin-google")
def googleCallback():
    # fetch access token and id token using authorization code
    print(session)
    token = oauth.myApp.authorize_access_token()
    print(token)
    personDataUrl = "https://people.googleapis.com/v1/people/me?personFields=genders,birthdays"
    personData = requests.get(personDataUrl, headers={
        "Authorization": f"Bearer {token['access_token']}"
    }).json()
    token["personData"] = personData
   
    # set complete user information in the session
    session["user"] = token["userinfo"]
    session['provider'] = "Google"
    
    # print(session["user"])
    print("ok",session)
    return redirect(url_for("home"))


    
@app.route("/google-login")
def googleLogin():
    print(session)
    if "user" in session:
        abort(404)

    return oauth.myApp.authorize_redirect(redirect_uri=url_for("googleCallback", _external=True))

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form['email']
        pwd = request.form['password']
        cur = mysql.connection.cursor()
        cur.execute(f"select * from user where email = '{email}'")
        users = cur.fetchone()
        cur.close()
        print(users)
        if users and pwd == users[3]:
            session['user'] = {"email":users[0]}
            session["provider"] = "sql"
            print(session)
            return redirect(url_for('home'))
        else:
            print(session)
            return render_template('login.html', error = 'Invalid email or password')
    return render_template('login.html')    

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        print("ok")
        email = request.form['email']
        password = request.form['password']

        cur = mysql.connection.cursor()
        user_name = email.split('@')[0]
        print(user_name)
        cur.execute(f"INSERT INTO user (email,username, avatar, password) VALUES ('{email}','{user_name}','{'https://ps.w.org/user-avatar-reloaded/assets/icon-256x256.png?rev=2540745'}','{password}')")
        mysql.connection.commit()
        cur.close()

        # Đăng ký thành công, chuyển hướng đến trang đăng nhập
        return redirect(url_for('login'))
    else:
        return render_template('register.html')

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


@app.route("/classification")
def classification():
    if session:
        CS = mysql.connection.cursor()
        print(session["user"]["email"])
        CS.execute(f"""SELECT * FROM user where email='{session["user"]["email"]}'""")
        Executed_DATA = CS.fetchone()
        print(Executed_DATA)
        return render_template('classification.html', session = Executed_DATA)
    else:
        return redirect(url_for('login'))


@app.route("/video_feed")
def video_feed():
    return Response(generate(), mimetype="multipart/x-mixed-replace; boundary=frame")


@app.route('/classify', methods=['POST'])
def upload_file():
    print(request.files)
    if 'uploadFile[]' not in request.files:
        return redirect(request.url)

    files = request.files.getlist('uploadFile[]')
    if files:
        file_names = []
        results_pre = []
        results_pre_temp = []
        is_video = False
        for file in files:
            if imghdr.what(file) and file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                path_save = os.path.join(app.config['UPLOAD_FOLDER'] + "/image/img_process/", filename)
                file.save(path_save)
                frame = cv2.imread(path_save)
                results = model.predict_img(frame)
                result_img = model.custom_display(colors=color())
                msg = 'File predict successfully'
                # print(file_names)
                if len(results) > 0:
                    dictObject, save_name = model.count_object(results, app.config['UPLOAD_FOLDER'], result_img)
                    results_pre_temp.append(dictObject)
                    file_names.append(save_name)
                    # Trả về kết quả
                # else:
                #     msg = 'Invalid Uplaod only png, jpg, jpeg, gif'
                #     return {'htmlresponse': render_template('response.html', msg=msg, filenames=file_names)}
            else:
                is_video = True
                path_save = os.path.join(app.config['UPLOAD_FOLDER'] + "/image/img_process/", file.filename)
                file.save(path_save)
                print(path_save)
                msg = 'File predict successfully'
                totalCount, dictObject, save_file = model.predict_video(video_path=path_save,
                                                                        save_dir=app.config[
                                                                                     'UPLOAD_FOLDER'] + "/video/",
                                                                        save_format="avi",
                                                                        display='custom',
                                                                        colors=color())
                video = model.convert_video(save_file, app.config['UPLOAD_FOLDER'] + "/videoOut/")
                file_names.append(video)
        if results_pre_temp.__len__() > 0:
            if results_pre.__len__() > 0:
                results_pre.clear()
            results_pre.extend(results_pre_temp)
            results_pre_temp.clear()
        return jsonify(
            {'htmlresponse': render_template('response.html', is_video=is_video, msg=msg, filenames=file_names),
             "Info": results_pre,
             'success': True, })
    else:
        return {'htmlresponse': 'Error!',
                'success': False, }


# def _get_files():
#     file_list = os.path.join(app.config['UPLOAD_FOLDER'], 'files.json')
#     if os.path.exists(file_list):
#         with open(file_list) as fh:
#             return json.load(fh)
#     return {}

@app.route('/download', methods=['POST'])
def download():
    try:
        # Ensure the 'url' key is present in the JSON data
        data = request.get_json()
        url = data['url']
        print(url)
        r = requests.get(url, stream=True)
        # url = data.get('url')
        if not url:
            raise ValueError("URL is missing in the request data.")

        print(f"Downloading image from: {url}")

        # Fetch the image from the given URL
        # response = requests.get(url)
        # response.raise_for_status()  # Raise an error for bad responses

        # Create a BytesIO object from the image content
        # img_data = BytesIO(response.content)

        # Ensure the upload folder exists
        upload_folder = app.config['UPLOAD_FOLDER']
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)

        # Generate a filename based on the URL
        filename = get_filename_from_url(url)
        image_path = os.path.join(upload_folder, filename)

        # Save the image locally
        with open(image_path, 'wb') as f:
            for chunk in r.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    f.write(chunk)

        print(f"Saved file to: {image_path}")

        # Check the file type using imghdr
        file_type = imghdr.what(image_path)

        if file_type:
            # It's an image
            print(f"Detected image type: {file_type}")

            # Read the image using OpenCV
            frame = cv2.imread(image_path)

            # Perform image prediction using the 'model'
            results = model.predict_img(frame)
            print(f"Image prediction results: {results}")

            # Display the results with custom colors
            result_img = model.custom_display(colors=color())

            # If there are positive results, count objects and save the image
            if len(results) > 0:
                dictObject, save_name = model.count_object(results, upload_folder, result_img)
                print(f"Saved result image to: {save_name}")
                return jsonify({'success': True, 'file_path': f"static/yolov8/{save_name}", "Info": dictObject})
        else:
            # Check the image type using imghdr
            totalCount, dictObject, save_file = model.predict_video(video_path=image_path,
                                                                    save_dir=app.config[
                                                                                 'UPLOAD_FOLDER'] + "/video/",
                                                                    save_format="mp4",
                                                                    display='custom',
                                                                    colors=color())
            video = model.convert_video(save_file, app.config['UPLOAD_FOLDER'] + "/videoOut/")

            return jsonify({'success': True, 'image_path': f"static/yolov8/{video}", "Info": dictObject})

        return jsonify({'success': True, 'image_path': "No positive results", "Info": {}})

    except requests.RequestException as req_err:
        return jsonify({'success': False, 'error': f"Request error: {str(req_err)}"})

    except Exception as e:
        return jsonify({'success': False, 'error': f"An error occurred: {str(e)}"})


# Function to generate video frames
#
# def generate():
#     cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
#     # path = os.path.join()
#     shrimp_detection_model = YOLO("best1686.pt")
#     while True:
#         ret, frame = cap.read()
#
#         if ret:
#             detections = shrimp_detection_model(frame, stream=True)
#             class_names = shrimp_detection_model.names
#
#             for detection in detections:
#                 boxes = detection.boxes
#
#                 for box in boxes:
#                     x1, y1, x2, y2 = box.xyxy[0]
#                     x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
#
#                     # Draw rectangle on frame
#                     rec = cv2.rectangle(frame, (x1, y1), (x2, y2), random_color(), 2)
#
#                     class_index = int(box.cls)
#                     label = class_names[class_index]
#
#                     # Add label to the rectangle
#                     cv2.putText(
#                         frame,
#                         label,
#                         (x1, y1),
#                         cv2.FONT_HERSHEY_COMPLEX,
#                         0.4,
#                         (0, 0, 255),
#                         1,
#                         cv2.LINE_AA,
#                     )
#                     (flag, encodedImage) = cv2.imencode(".jpg", frame)
#                     if not flag:
#                         continue
#                     yield (
#                             b"--frame\r\n"
#                             b"Content-Type: image/jpeg\r\n\r\n"
#                             + bytearray(encodedImage)
#                             + b"\r\n"
#                     )
#     cap.release()


def generate():
    video_path = "GA67XBluaYotwT4DAA_3CBFm4wlRbmdjAAAF.mp4"
    cap = cv2.VideoCapture(video_path)

    # shrimp_detection_model = YOLO("best1686.pt")


    while True:
        ret, frame = cap.read()

        if ret:
            detections = model.predict_img(frame,stream=True)
            class_names = model.names

            for detection in detections:
                boxes = detection.bogitgxes

                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0]
                    x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)

                    # Draw rectangle on frame
                    rec = cv2.rectangle(frame, (x1, y1), (x2, y2), random_color(), 2)

                    class_index = int(box.cls)
                    label = class_names[class_index]

                    # Add label to the rectangle
                    cv2.putText(
                        frame,
                        label,
                        (x1, y1),
                        cv2.FONT_HERSHEY_COMPLEX,
                        2, (0, 0, 255), 2,
                        cv2.LINE_AA,
                    )
                    (flag, encodedImage) = cv2.imencode(".jpg", frame)
                    if not flag:
                        continue
                    yield (
                        b"--frame\r\n"
                        b"Content-Type: image/jpeg\r\n\r\n"
                        + bytearray(encodedImage)
                        + b"\r\n"
                    )
    cap.release()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_filename_from_url(url):
    parsed_url = urlparse(url)
    filename = os.path.basename(parsed_url.path)
    return filename


def color():
    colors = []
    for _ in range(80):
        rand_tuple = (random.randint(50, 255), random.randint(50, 255), random.randint(50, 255))
        colors.append(rand_tuple)
    return colors


def random_color():
    return tuple(random.randint(0, 255) for _ in range(3))


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=appConf.get(
        "FLASK_PORT"), debug=True)

