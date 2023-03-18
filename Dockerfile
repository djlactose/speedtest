FROM nginx

EXPOSE 80

COPY index.html /usr/share/nginx/html/
COPY 100MB.bin /usr/share/nginx/html/
COPY default.conf /etc/nginx/conf.d/
COPY main.py /root/bin/
COPY run.sh /root/bin/

RUN apt-get update &&\
apt-get install python3 python3-pip -y && \
pip install flask flask-cors

ENTRYPOINT ["/root/bin/run.sh"]