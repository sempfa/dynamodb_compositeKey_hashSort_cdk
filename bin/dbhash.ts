#!/usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DbhashStack } from '../lib/dbhash-stack';

const app = new cdk.App();
new DbhashStack(app, 'DbhashStack');