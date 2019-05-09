FROM node:10
COPY  . /TSW
WORKDIR /TSW
RUN npm install --no-optional
RUN apt-get update && apt-get install gawk rsync
EXPOSE 80
ENV IS_DOCKER=1
CMD ["/TSW/bin/proxy/startup.sh"]
