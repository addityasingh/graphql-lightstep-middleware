Verifying `graphql-lightstep-middleware` example can be done with below setup

## Run lightstep satelite

To test lightstep locally, we need to first run `lightstep` satelite for developer mode. This is documented on lightstep site [Use Developer mode](https://docs.lightstep.com/docs/use-developer-mode-to-quickly-see-traces)

## Run example

To run the example for `graphql-with-lightstep` run

```sh
yarn run tsc && node dist/graphql-with-lightstep.js
```

## Result

If the setup works correctly, you would see below event in lightstep dashboard
![trace event](https://user-images.githubusercontent.com/5351262/73496357-adf85d00-43b8-11ea-85c2-468f10afbf2f.png)
and the corresponding trace as below
![trace view](https://user-images.githubusercontent.com/5351262/73496358-adf85d00-43b8-11ea-9b56-f53c5a6b2220.png)
