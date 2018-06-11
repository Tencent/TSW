FROM alpine
RUN apk --update --no-cache add procps git nodejs bash gawk
RUN git clone https://github.com/Tencent/TSW.git /TSW
WORKDIR /TSW
VOLUME /data/release/node_modules/
RUN npm install --no-optional
EXPOSE 80
ENV IS_DOCKER=1
CMD ["/TSW/bin/proxy/startup.sh"]

