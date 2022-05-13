import * as path from 'path';
import { execSync, exec } from 'child_process';
import TerserPlugin from 'terser-webpack-plugin';

export default (env, argv) => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    mode: isProd ? 'production' : 'development',
    devtool: false,
    entry: {
      index: path.resolve('./src/index.ts'),
    },
    output: {
      path: path.resolve('./dist'),
      filename: '[name].js',
      library: {
        type: 'module',
      },
    },
    experiments: {
      outputModule: true,
    },
    target: ['web'],
    resolve: {
      extensions: ['.js', '.ts', '.json'],
    },
    module: {
      rules: [
        {
          test: /\.(t|j)sx?$/,
          exclude: /node_modules/,
          use: [
            { loader: 'babel-loader' },
          ],
        },
      ],
    },
    stats: {
      colors: true,
      errorDetails: true,
    },
    optimization: {
      minimize: isProd,
      minimizer: [
        new TerserPlugin({
          extractComments: false,
        }),
      ],
    },
    watchOptions: {
      ignored: ['**/node_modules'],
    },
    plugins: [
      {
        apply: (compiler) => {
          compiler.hooks.done.tap('AfterBuild', () => {
            exec('npm run build:types');
            // exec('cd ../wx/; npm run build:npm');
          });
        },
      }
    ],
  };
};
