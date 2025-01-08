export PATH := "./node_modules/.bin:" + env_var('PATH')

dev *flags:
    wrangler dev

typegen:
    wrangler types --env-interface Wenv

deploy:
    wrangler deploy

check:
    tsc --noEmit --watch --skipLibCheck

test *flags:
    vitest --exclude ".direnv/**" {{flags}}
