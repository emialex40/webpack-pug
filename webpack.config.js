const path = require("path");
const fs = require("fs");
const argv = require('yargs').argv;
const webpack = require('webpack');
const CleanWebpackPlugin = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlWebpackPugPlugin = require('html-webpack-pug-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const isDevelopment = argv.mode === 'development';
const isProduction = !isDevelopment;

function generateHtmlPlugins(templateDir) {
    const templateFiles = fs.readdirSync(path.resolve(__dirname, templateDir));
    return templateFiles.map(item => {
        const parts = item.split(".");
        const name = parts[0];
        const extension = parts[1];
        return new HtmlWebpackPlugin({
            filename: `${name}.html`,
            template: path.resolve(__dirname, `${templateDir}/${name}.${extension}`),
            inject: false
        });
    });
}

const htmlPlugins = generateHtmlPlugins("./src/pug/views");

const config = {
    entry: ["./src/js/index.js", "./src/sass/style.sass"],
    output: {
        filename: "./js/index.js"
    },
    devtool: "source-map",
    mode: "development",
    optimization: {
        minimizer: [
            new TerserPlugin({
                sourceMap: true,
                extractComments: true
            })
        ]
    },
    module: {
        rules: [{
                test: /\.(sass|scss)$/,
                include: path.resolve(__dirname, "src/sass"),
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: "css-loader",
                        options: {
                            sourceMap: true,
                            url: false
                        }
                    },
                    {
                        loader: "postcss-loader",
                        options: {
                            ident: "postcss",
                            sourceMap: true,
                            plugins: () => [
                                require("autoprefixer")({
                                    browsers: ['ie >= 8', 'last 4 version']
                                }),
                                isProduction ? require('cssnano')({ preset: ["default", { discardComments: { removeAll: true } }] }) : () => {}
                            ]
                        }
                    },
                    {
                        loader: "sass-loader",
                        options: {
                            sourceMap: true
                        }
                    }
                ]
            },
            {
                test: /\.pug$/,
                use: ['pug-loader']
            }
        ]
    },
    devServer: {
        overlay: true
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            'window.jQuery': 'jquery',
        }),
        new MiniCssExtractPlugin({
            filename: "./css/style.min.css",
            allChunks: true
        }),
        new HtmlWebpackPlugin({
            test: /\.pug$/,
            use: [
                "file-loader?name=[path][name].html",
                "extract-loader",
                "html-loader",
                "pug-loader"
            ]

        }),
        new CopyWebpackPlugin([{
                from: "./src/fonts",
                to: "./fonts"
            },
            {
                from: "./src/favicon",
                to: "./favicon"
            },
            {
                from: "./src/img",
                to: "./img"
            },
            {
                from: "./src/uploads",
                to: "./uploads"
            }
        ])
    ].concat(htmlPlugins),
};

module.exports = config;

module.exports = (env, argv) => {
    if (argv.mode === "production") {
        config.plugins.push(new CleanWebpackPlugin());
    }
    return config;
}