

import { di_container } from './di';
import { Service, InjectFromNServer } from './meta'
import { Singleton } from './singleton';

import { context_manager, Context } from './context';
import { getConfigValue } from './config';

export { 
    Service, InjectFromNServer, 
    di_container, 
    context_manager, Context, Singleton,
    getConfigValue
 };