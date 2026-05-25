# 国内最省钱上线方案

## 目标方案

第一阶段用一台国内轻量服务器同时放网站和压缩后的视频，不开对象存储和 CDN。等作品数量、视频体积或访问量上来后，再迁到 COS/OSS + CDN。

## 购买清单

- 域名：`.com` 或 `.cn`，在阿里云/腾讯云购买。
- 服务器：中国大陆轻量应用服务器，低配即可。
- 备案：ICP 备案 + 公安备案。

## 文件上传位置

建议服务器目录：

```text
/var/www/portfolio
```

把本项目里的这些内容上传到该目录：

```text
index.html
styles.css
script.js
robots.txt
sitemap.xml
projects/
assets/
```

视频文件建议放：

```text
assets/videos/
```

封面图建议放：

```text
assets/images/
```

## 上线前必须替换

1. 把 `robots.txt` 和 `sitemap.xml` 里的 `https://your-domain.com` 替换成你的真实域名。
2. 把 `nginx-site.conf` 里的 `your-domain.com` 替换成你的真实域名。
3. 把所有页面 footer 里的 `ICP备案号：备案后替换` 替换成真实 ICP 备案号。
4. 把所有页面 footer 里的 `公安备案号：备案后替换` 替换成真实公安备案号。

## Nginx 部署

把 `nginx-site.conf` 复制到：

```text
/etc/nginx/conf.d/portfolio.conf
```

检查并重载：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## HTTPS

备案通过并解析域名后，使用服务器面板或 Certbot 配置 HTTPS。HTTPS 配好后再去百度搜索资源平台提交站点。

## 视频体积建议

- 首页封面图：300KB - 1MB。
- 首页尽量用封面图，不自动加载大视频。
- 短视频合集：每条 10MB - 50MB。
- 长片/TVC/纪录片：放精选片段，不放超大原片。
- 第一阶段总视频容量建议控制在 10GB - 20GB 以内。

## 搜索收录

上线后提交：

- 百度搜索资源平台：https://ziyuan.baidu.com/
- sitemap 地址：`https://你的域名/sitemap.xml`

## 什么时候升级

出现这些情况再考虑对象存储 + CDN：

- 视频总量超过 20GB。
- HR 打开视频明显慢。
- 网站访问量变多。
- 需要长期稳定展示高清视频。
