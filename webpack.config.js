const path = require('path');
const fs = require('fs');
const HtmlPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

const files  = [];

function throughDirectory(directory) {
    const directoryContents = fs.readdirSync(directory);
    directoryContents.forEach((file) => {
      const absolute = path.join(directory, file);
      if (fs.statSync(absolute).isDirectory()) return throughDirectory(absolute);
      else return files.push(absolute);
    });
  
    return files;
  }
function scanDirectory(directory) {
    const tempfiles = [];
  
    fs.readdirSync(directory).forEach((file) => {
      const extension = file.split(".");
  
      if (extension[extension.length - 1] === "js" || extension[extension.length - 1] === "html" || extension[extension.length - 1] === "css") {
        const absolute = path.join(directory, file);
  
        if (fs.statSync(absolute).isDirectory()) return throughDirectory(absolute);
        return tempfiles.push(`./${absolute.replace(/\\/g, '/')}`);
      }
    });
  
    return tempfiles;
  }
  function generateHtmlPlugins(templateDir) {
    const htmlFiles = throughDirectory(templateDir);
    return htmlFiles.map((item) => {
      const parts = item.split(path.sep);
      const name = parts[parts.length - 1];
      return new HtmlPlugin({
        filename: name,
        template: path.resolve(item),
        inject: true,
      })
    })
  }

const cssFiles = scanDirectory('./src/css/');
const htmlFiles = scanDirectory('./src/html/');
const jsFiles = scanDirectory('./src/js/');

module.exports = {
  target: 'web',
  mode: 'development',
    entry:  [
        ...htmlFiles,
        ...jsFiles,
        ...cssFiles
    ],
    output: {
        path: path.resolve(__dirname, 'build'),
    },
    devtool: 'source-map',
    optimization: {
      minimizer: [
        new CssMinimizerPlugin(),
      ],
      minimize: true
    },
    plugins: [
        new CopyPlugin({
          patterns: [
            {
              from: path.resolve(__dirname, `src/img`),
              to: path.resolve(__dirname, `build/img/`),
            },
            {
              from: path.resolve(__dirname, `src/css`),
              to: path.resolve(__dirname, `build/css`)
            }
          ],
        }),
    ].concat( generateHtmlPlugins(`./src/html`)),
    module: {
        rules: [
            {
                test: /\.(js)$/i,
                include: path.resolve(__dirname, `src/js`),
                exclude: /(node_modules)/,
                use: [
                    "babel-loader"
                ],
            },
            {
                test: /\.(css)$/,
                include: path.resolve(__dirname, `src/css`),
                use: [ "css-loader"],
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
                type: 'asset',
            },
            {
                test: /\.(html)$/,
                include: path.resolve(__dirname, `src/html/`),
                loader: "html-loader",
                options: {
                  sources: false,
                },
            },
            {
              test: /.html$/,
              loader: 'string-replace-loader',
              options: {
                multiple: [
                  {
                    search: '<link rel="stylesheet" href="../css',
                    replace: '<link rel="stylesheet" href="./css',
                    flags: 'g'
                  },
                  {
                    search: '../img',
                    replace: './img',
                    flags: 'g'
                  }
                ]
              }
            }
            // Add your rules for custom modules here
            // Learn more about loaders from https://webpack.js.org/loaders/
        ],
    },
};