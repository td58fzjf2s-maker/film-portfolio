# GitHub Pages 部署说明

## 适合当前网站的方式

这个项目是纯静态网站，可以直接部署到 GitHub Pages。推荐使用本项目已经添加的 GitHub Actions 自动发布方式。

## 第一次发布

1. 在 GitHub 新建一个仓库，例如：

```text
film-portfolio
```

2. 把当前项目里的文件上传到仓库根目录。

3. 进入仓库：

```text
Settings -> Pages
```

4. Source 选择：

```text
GitHub Actions
```

5. 推送到 `main` 分支后，GitHub 会自动运行 `.github/workflows/pages.yml`。

6. 部署完成后，访问地址通常是：

```text
https://你的GitHub用户名.github.io/仓库名/
```

如果仓库名是 `你的GitHub用户名.github.io`，访问地址会变成：

```text
https://你的GitHub用户名.github.io/
```

## 上线后要替换的地方

把下面文件里的占位替换成你的真实 GitHub Pages 地址：

```text
robots.txt
sitemap.xml
```

需要替换：

```text
https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPOSITORY_NAME
```

例如：

```text
https://abc.github.io/film-portfolio
```

## 关于视频

GitHub Pages 可以放少量小视频，但不适合放很多大视频。

建议：

- 首页尽量用封面图。
- 短视频压缩后再上传。
- 单个视频尽量控制在 10MB - 50MB。
- 大视频继续用 B站，或者以后迁移到对象存储。

## 不需要的国内部署文件

如果你只用 GitHub Pages，下面文件只是备用，不参与 GitHub Pages 部署：

```text
DEPLOY_CN.md
nginx-site.conf
```

## 自定义域名

如果以后买域名，可以在 GitHub Pages 设置里绑定自定义域名。绑定后再创建 `CNAME` 文件，内容只写你的域名，例如：

```text
www.yourname.com
```

暂时没有域名时，不要创建 `CNAME` 文件。
