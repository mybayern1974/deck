/*
 * Copyright 2018 Google, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

import { ICluster } from '../../../core/src/domain';

import { get } from 'lodash';

const angular = require('angular');

module.exports = angular
  .module('spinnaker.kubernetes.serverGroup.artifactExtractor', [])
  .factory('kubernetesServerGroupArtifactExtractor', function() {
    function extractArtifacts(cluster: ICluster): string[] {
      const containers = (cluster.containers || []).concat(cluster.initContainers || []);
      return containers
        .filter(c => c.imageDescription && c.imageDescription.fromArtifact)
        .map(c => c.imageDescription.artifactId);
    }

    function removeArtifact(cluster: ICluster, reference: string): void {
      const artifactMatches = (container: any) =>
        container.imageDescription &&
        container.imageDescription.fromArtifact &&
        container.imageDescription.artifactId === reference;
      cluster.containers = get(cluster, 'containers', []).filter(c => !artifactMatches(c));
      cluster.initContainers = get(cluster, 'initContainers', []).filter(c => !artifactMatches(c));
    }

    return { extractArtifacts, removeArtifact };
  });