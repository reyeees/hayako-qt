const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env) => {
    const browser = (env.browser === 'firefox' || env.browser === 'chrome') ? env.browser : 'firefox';
     // Pass `--env browser=firefox` or `--env browser=chrome`

    return {
        entry: {
            background: './src/js/background.js',
            content: './src/js/content.js',
            options: './src/js/options.js',
            popup: './src/js/popup.js',
            google_translate_token: "./src/js/google_translate_token.js",
            languages: "./src/js/languages.js"
        },
        output: {
            path: path.resolve(__dirname, 'dist', browser),
            filename: 'js/[name].js',
            // libraryTarget: 'var'
        },
        resolve: {
            extensions: ['.js'],
            modules: ['node_modules'],
            alias: {
                '@': path.resolve(__dirname, 'src'), // Use '@' as a shorthand for the /src directory
                // "webextension-polyfill": "webextension-polyfill/dist/browser-polyfill.min.js"
            },
        },
        module: {
            rules: [
                // {
                //     test: /\.css$/i,
                //     use: [MiniCssExtractPlugin.loader, 'css-loader'],
                // },
                {
                    test: /\.html$/i,
                    loader: 'html-loader',
                    options: {
                        minimize: true,
                    },
                },
                {
                    test: /\.m?js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env'],
                            plugins: [
                                "@babel/plugin-transform-modules-commonjs",
                                "@babel/plugin-proposal-nullish-coalescing-operator", 
                                "@babel/plugin-proposal-optional-chaining", 
                                "@babel/plugin-syntax-optional-chaining", 
                                "@babel/plugin-proposal-object-rest-spread", 
                                "transform-class-properties"
                            ]
                        },
                    },
                },
            ],
        },
        // externals: {
            // Prevent bundling Node.js-specific modules
        // },
        plugins: [
            // new MiniCssExtractPlugin({
            //     filename: '[name].css',
            // }),
            // new HtmlWebpackPlugin({
            //     filename: 'options.html',
            //     template: './src/sheets/options.html',
            //     chunks: ['options'],
            //     minify: true,
            // }),
            // new HtmlWebpackPlugin({
            //     filename: 'popup.html',
            //     template: './src/sheets/main.html',
            //     chunks: ['popup'],
            //     minify: true,
            // }),
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: `src/manifest-${browser}.json`,
                        to: 'manifest.json',
                    },
                    { from: 'src/icons', to: 'icons' },
                    { from: 'src/sheets', to: 'sheets' },
                    // { from: 'src/common', to: 'common' }, // Copy shared scripts
                    // {
                    //     from: path.resolve(__dirname, 'node_modules/axios/dist/axios.cjs.map'),
                    //     to: path.resolve(__dirname, 'dist/js'),
                    // },
                ],
            }),
        ],
        optimization: {
            minimize: true,
            minimizer: [
                // new CssMinimizerPlugin(), // Minifies css
                new TerserPlugin({        // Minimizes JS files
                    terserOptions: {
                        format: {
                            comments: false, // Remove comments
                        },
                    },
                    extractComments: false, // Do not generate LICENSE.txt
                }),
            ]
        },
        mode: 'production',
        devtool: 'source-map',
        // devtool: false,
    };
};
