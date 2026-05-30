# 使用官方輕量版 Nginx 映像檔
FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf

# 將樣板檔案複製到 templates 資料夾
COPY default.conf.template /etc/nginx/templates/default.conf.template

# 修正：精準複製前端會用到的檔案與資料夾
COPY index.html /usr/share/nginx/html/
COPY js/ /usr/share/nginx/html/js/
# 根據你的 data.js，你有一個存放圖片的資料夾，記得一併複製！
COPY img/ /usr/share/nginx/html/img/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]