import os
import json
import yaml, pandas as pd
from utils import getFogAppLocations,normalizeData

import json

# Make sure image is provided
fogapp_data = os.getenv("DATA")
#fogapp_data=json.loads(fogapp_data)
fogapp_data = {'cpu':['1000m','1'],'memory':['1024Mi','2Gi'],'replicas':1, 'placement_policy':'most_traffic'}
# export DATA='{"cpu":["1000m","1"],"memory":["1024Mi","2Gi"],"replicas":1,"placement_policy":"best-fit"}'
fogapp_replicas=fogapp_data['replicas']
fogapp_placement_policy=fogapp_data['placement_policy']

fogapp_cpu_request,fogapp_memory_request = normalizeData(fogapp_data['cpu'],fogapp_data['memory'])

if not fogapp_replicas:
    raise print(f"Number of replicas must be set. Got {fogapp_replicas}.")

# Placement policy specified by user
if fogapp_placement_policy != "":
    placement_policy = fogapp_placement_policy
else: # Default placement policy is most_traffic
    placement_policy = 'most_traffic'

clusters_qty = 1

eligible_clusters = []

mode = 'create'
fogapp_locations = getFogAppLocations(fogapp_cpu_request, fogapp_memory_request, fogapp_replicas, clusters_qty, placement_policy, mode)
total_replicas = clusters_qty * fogapp_replicas

if len(fogapp_locations) != 0:
    eligible_clusters = []
    for cluster in fogapp_locations:
        if cluster['max_replicas'] > fogapp_replicas:
            cluster['replicas'] = fogapp_replicas
            cluster['overflow'] = 0
        else:
            cluster['replicas'] = cluster['max_replicas']
            cluster['overflow'] = fogapp_replicas - cluster['max_replicas']

    total_overflow = 0

    for cluster in fogapp_locations[:clusters_qty]:
        dict = {}
        dict['name'] = cluster['name']
        dict['replicas'] = cluster['replicas']
        eligible_clusters.append(dict)
        total_overflow += cluster['overflow']

    # print("Total overflow ...........", total_overflow)

    if total_overflow > 0:
        for cluster in fogapp_locations[clusters_qty:]:
            if cluster['max_replicas'] > total_overflow:
                dict = {}
                dict['name'] = cluster['name']
                dict['replicas'] = total_overflow
                total_overflow = 0
                eligible_clusters.append(dict)
                break
            else:
                dict = {}
                dict['name'] = cluster['name']
                dict['replicas'] = cluster['max_replicas']
                total_overflow = total_overflow - dict['replicas']
                eligible_clusters.append(dict)

    if total_overflow > 0:
        for cluster in eligible_clusters:
            if 'cloud' in cluster['name']:
                cluster['replicas'] += total_overflow
                total_overflow = 0

    # print("Final list of clusters .................", eligible_clusters)
    # print("Final overflow .................", total_overflow)

    if total_overflow > 0:
        dict = {}
        dict['message'] = 'to_cloud'
        dict['replicas'] = total_overflow
        # raise print("Fog clusters not sufficient to run the app. Provisioning cloud cluster.....................",delay=30)
else:
    dict = {}
    dict['message'] = 'to_cloud'
    dict['replicas'] = fogapp_replicas
    # print("No clusters found at the fog level. Provisioning cloud cluster.....................")


for cluster in eligible_clusters:
    if cluster['replicas'] == 0:
        eligible_clusters.remove(cluster)

# print("Final list of eligible clusters ...", eligible_clusters)

temp_list = []
for cluster in eligible_clusters:
    temp_list.append(cluster)

# print("Deploy temp list ,,,,,,,,,,,,,,,,,,", temp_list)
print(temp_list)
# return temp_list
