FROM alpine
RUN apk --update --no-cache add nodejs git && \
    git clone https://github.com/Tencent/TSW.git
WORKDIR TSW
VOLUME /data/release/node_modules/
RUN npm install --no-optional
EXPOSE 80
CMD ["node", "--inspect", "index.js"]

