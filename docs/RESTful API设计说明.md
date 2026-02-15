
# 标准操作
## add 
- method: POST
- function: add
- url: api/{m|c|p}/{nserver}/{nservice}s
- params: 
  - data: body

## get 
- method: GET
- function: get
- url: api/{m|c|p}/{nserver}/{nservice}s/:id
- params: 
  - id: path

## update
- method: PUT
- function: update
- url: api/{m|c|p}/{nserver}/{nservice}s/:id
- params: 
  - id: path
  - data: body

## remove
- method: DELETE
- function: remove
- url: api/{m|c|p}/{nserver}/{nservice}s/:id
- params: 
  - id: path

## query
- method: POST
- function: query
- url: api/{m|c|p}/{nserver}/{nservice}s/filters/query
- params: 
  - filter: body
  - limit: query
  - offset: query

## action
- method: PUT
- function: update
- action_name: 标准操作配置中存在，自定义的action_name, 只作用于路由
- url: api/{m|c|p}/{nserver}/{nservice}s/:id/actions/:action_name
- params: 
  - id: path
  - data: config

## batch_action
- method: PUT
- function: batch_update
- action_name: 标准操作配置中存在，自定义的action_name, 只作用于路由
- url: api/{m|c|p}/{nserver}/{nservice}s/actions/:action_name
- params: 
  - ids: body.ids
  - data: config

## batch_remove
- method: DELETE
- function: batch_remove
- url: api/{m|c|p}/{nserver}/{nservice}s/actions/batch_remove
- params: 
  - ids: body.ids

## findOne
- method: POST
- function: findOne
- url: api/{m|c|p}/{nserver}/{nservice}s/filters/findOne
- params: 
  - filter: body

## tree
- method: POST
- function: tree
- url: api/{m|c|p}/{nserver}/{nservice}s/filters/tree
- params: 
  - filter: body

## filter
- method: GET
- function: query
- action_name: 标准操作配置中存在，自定义的action_name, 只作用于路由
- url: api/{m|c|p}/{nserver}/{nservice}s/filters/:action_name
- params:
  - data: config
  - limit: query
  - offset: query

## count
- method: POST
- function: count
- url: api/{m|c|p}/{nserver}/{nservice}s/filters/count
- params: 
  - filter: body

