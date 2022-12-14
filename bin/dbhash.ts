#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DbhashStack } from '../lib/dbhash-stack';

const app = new cdk.App();
new DbhashStack(app, 'DbhashStack');