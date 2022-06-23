from kubernetes import client, config
from kubernetes.client.rest import ApiException
from collections import defaultdict
from pint        import UnitRegistry
from prometheus_api_client import PrometheusConnect
import subprocess
import operator
import os
import math
import pandas as pd
import json

configK8s = os.getenv("KUBECONFIG")
configK8s = json.loads(configK8s)
# Load k8s contexts
# configK8s = {
#   "apiVersion": "v1",
#   "clusters": [
#     {
#       "cluster": {
#         "certificate-authority-data": "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUMvakNDQWVhZ0F3SUJBZ0lCQURBTkJna3Foa2lHOXcwQkFRc0ZBREFWTVJNd0VRWURWUVFERXdwcmRXSmwKY201bGRHVnpNQjRYRFRJeU1EWXdNekV5TkRBME0xb1hEVE15TURVek1URXlOREEwTTFvd0ZURVRNQkVHQTFVRQpBeE1LYTNWaVpYSnVaWFJsY3pDQ0FTSXdEUVlKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBTnA0CjRUQ2MwSWRNMCt2NDBYU0FDNU9HSDhLMUV2TjFiL3FBRkVVREM1aWtIV0tsbXQ2dS9YbTZDTHphU2ZBaDRzWE4Kc1JHVHJucXRIT3hYbStNQ2RudUdKdDArVlpLMWIzQTcrV0YxSUlJanpBVHNmTDNzUUFDcWxtMWRSa3dNSEQ4UQorOUJrMU43NVY5cFR4eGcrbDBtWlhxbUZYOHhEanFIbDd6ZzduOUlkVGFzU3pBaS9xQ2xidmxSUHJuUWVuUDZ2CmNUY3A0aHg5WU9OakRDQVBVcTlqdE9ZUHpGL1hzb0c2SWpkV3BRbk1GcmVVLzYrQ0pYak0rQVJZMW4xTkZHblMKK0FVeXgycVYvOVU3OHc1cHBELzZFMC9MS0ZIclFOYXNUQ0tuNEs3bGlRQVRoTEVyQlY0bHovcXIzS2tOaXJzVApRRFVGbi81L0NFSDZhSU8yRFE4Q0F3RUFBYU5aTUZjd0RnWURWUjBQQVFIL0JBUURBZ0trTUE4R0ExVWRFd0VCCi93UUZNQU1CQWY4d0hRWURWUjBPQkJZRUZPdldweDRNREJSQ0RsSEJGdEpBOW9hL1IwNGpNQlVHQTFVZEVRUU8KTUF5Q0NtdDFZbVZ5Ym1WMFpYTXdEUVlKS29aSWh2Y05BUUVMQlFBRGdnRUJBQmNYMERrUE9uQXEwMTZPa2VIbAo2VSsrT1JodkVQUU1SbkJYWW1TdHlnMWQyZ1IxelZvWW5zbmxVcnJNWlZzOHZYN21zekViVEg4aENiNjBQczFVCldXQ3I3bHVUbG5JSFhtalNGRXZNU3Q5eHdzZE1HNHR4MkhibmdCQVJnM3BpK1dsdXB0YVdKVC8xck1nM3ZETzUKbm96d3ZseFVEbEdNYnpSTFQ4Q0cxRk5uN1hIMFlFVHlSWGN5YkxaUm1oZVdxaU4xKzhyVkN4S05xQ2pWVHgreAptanJWc0k3U1lrNzVEWjBGNC9IYnE3WG5kdlBKVFg3elM2UkR5MkEvc0hZTTlOdCtYUDl6Z3JiYm1Yb3FJYXpSCkpqSW5KMkxFSVEyNGFCVXBKRzhtYjc1aHloN3M2VldJbE14Skd3UUFSWTg2cjRTOS95MmxUREc0TWpIVTQ0bk0KS2FZPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg==",
#         "server": "https://192.168.250.176:6443"
#       },
#       "name": "kubernetes"
#     },
#     {
#       "cluster": {
#         "certificate-authority-data": "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUMvakNDQWVhZ0F3SUJBZ0lCQURBTkJna3Foa2lHOXcwQkFRc0ZBREFWTVJNd0VRWURWUVFERXdwcmRXSmwKY201bGRHVnpNQjRYRFRJeU1EVXdPVEE1TWpFek5Gb1hEVE15TURVd05qQTVNakV6TkZvd0ZURVRNQkVHQTFVRQpBeE1LYTNWaVpYSnVaWFJsY3pDQ0FTSXdEUVlKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBTWdhCjZ0YytGMmpOMTMzMy82clpjMkRpQW5pVWZDcC9BcEVRWTdJOGxsTE5RTTJab3VybThuc01kWXZwY3hQdzRkYmUKQkE3enNWNHBGejcxVTRtWUFaTUE0NjRxaFNFTTRZRFBBQjJ3NDdNWk1xOWd3bk5HY09oQkpHblIraGRxeVJzdApOTG9IK1lRR0FhSmd2dWpOY3hxOTJIKyswV2N2QkNPRWxVbDNad09YM1MrWnRkNVNQSHEyWXJnRCswTXZHcHpmCjI2aUNLWVkzOTNIb2htK2N1MlVwVy9ZTi91b2hQVTRNRXduNHZEOGxhN0ZCWWgwdThORFFCS2dwMVdleGlrOXIKSzlhWlR6TlVYYjFNa2MyUWRpRm1pWTQxN1FmcWZCVUxpbnFndWZaTTBXZnFWeFdiWkdRWlVlR05DUmMyMTYwdwo3SnJnWXVCd2ZRL2ZlOVI3SEUwQ0F3RUFBYU5aTUZjd0RnWURWUjBQQVFIL0JBUURBZ0trTUE4R0ExVWRFd0VCCi93UUZNQU1CQWY4d0hRWURWUjBPQkJZRUZQWmppb2xVYlQ0QUovSHl0QW9XMnM0ZVpvS0xNQlVHQTFVZEVRUU8KTUF5Q0NtdDFZbVZ5Ym1WMFpYTXdEUVlKS29aSWh2Y05BUUVMQlFBRGdnRUJBQTFYL2UrM2xSTUJBL0N6SmN4Nwo2ZG1LQTFIRUQ3bldoN2hqbFY4TDEvR2t5SUxjMHZRNjhjQ2FmRVNWT085VjJuUVVndzQ4VURnMDVZL2lYUDZUCjhPZzcvV1RnMFUvb05vYStGNGRseGxGSmdFYi96NDJBVlFMMy9BKzR4dk1CTTNZTkMxUlE3ZlBsc3JXZ0hWU2kKcG52dXU0NHRsNmsraE1FLzlMaTl1NG1JZGJITHRVK04wMngybnVyRUFCSHIrVmdyUC9MTHhjSWlJSkRwWlBuUwpmM3hWc1EyUUhGWFFlTkdPckIxUDkwbGQ0dlRKL3psdkVZMC9qaGp0L09WTFM2MWJLdWFzZkRBeHpxc3VFbFZECm1QSExsRGVIU3lBeitSVXJXVXdwS2lOdy9XZ2JISWdWbzB3WmJrdnV5VVBSamNabnhEemhZc083YjlUMEFxNmYKYzVjPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg==",
#         "server": "https://192.168.250.200:6443"
#       },
#       "name": "kubernetes2"
#     }
#   ],
#   "contexts": [
#     {
#       "context": {
#         "cluster": "kubernetes",
#         "user": "kubernetes1"
#       },
#       "name": "kubernetes"
#     },
#     {
#       "context": {
#         "cluster": "kubernetes2",
#         "user": "kubernetes2"
#       },
#       "name": "kubernetes2"
#     }
#   ],
#   "current-context": "kubernetes",
#   "kind": "Config",
#   "preferences": {},
#   "users": [
#     {
#       "name": "kubernetes1",
#       "user": {
#         "client-certificate-data": "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURJVENDQWdtZ0F3SUJBZ0lJSW02L2ZPNGkrTGN3RFFZSktvWklodmNOQVFFTEJRQXdGVEVUTUJFR0ExVUUKQXhNS2EzVmlaWEp1WlhSbGN6QWVGdzB5TWpBMk1ETXhNalF3TkROYUZ3MHlNekEyTURNeE1qUXdORFZhTURReApGekFWQmdOVkJBb1REbk41YzNSbGJUcHRZWE4wWlhKek1Sa3dGd1lEVlFRREV4QnJkV0psY201bGRHVnpMV0ZrCmJXbHVNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXVkNEVJUXlMTm1KVVNLNXAKOXhPRmFlZEhPVGlwQkNEY1FVbzFCcmdIRjdXTFk2NExhaFdyYmlaeS9CVE9iR0R2WTNGL2t5VVRaNWhacnUxMgpONHhOWmFaYTJCemZNVTM2TnVQZmNVSFl1U3Myb01qeEF4eDNESjdYeFZmaXREWk02MVlKTGV1UWhsVUJSazYyCjFtWkVtT0lEUDZFc3dNZWsxY3Nva1dzMzh0VTh5SkNtbnpGY3BjUnRqNkhNTUtkNEh4cUVOeXZmNnYxR2ZrUVEKQ2xiOVpQanRyWGFWWkQrMUdocllwZFQwWVdSbm5GNzdFQlp2YWhhNEZoYi9Tem4xZEdoVXBSMHdMZ2hHWjZlWAo3blI5MHRmVFNTamdlclBLR0licTd4Y21tMEJmKzFnalNpSkNVcE02R3NjdEdlQjcwYm8vMTRhWUR0d2p4TEh5Ck95SWFKd0lEQVFBQm8xWXdWREFPQmdOVkhROEJBZjhFQkFNQ0JhQXdFd1lEVlIwbEJBd3dDZ1lJS3dZQkJRVUgKQXdJd0RBWURWUjBUQVFIL0JBSXdBREFmQmdOVkhTTUVHREFXZ0JUcjFxY2VEQXdVUWc1UndSYlNRUGFHdjBkTwpJekFOQmdrcWhraUc5dzBCQVFzRkFBT0NBUUVBdFhZK3RKUVQzUHdDVElsbXdiNnRIRXF2eXN6UE9oTk1PRzRsCnJUL29hd20xa1M1eFRrRzkwREJSYXBzZjlDMlBpb1F3b3kyVkRocldUVW1ISXQ0MVc2ci9RL21ZV1pDM1RmL1UKMUVtMUVGM1ozSDdwdWNQVkowbHdhMkNENTdxdmRlcXZWT29VL2k0TzRiTlhrOUtYM2o3Z1lhOTNqSC9kMWV1LwpBNGlIUk1wcXY5OGZLYUdWMWJ4MWV0N1kxdGk0WGNxNjlyVitLdm0xYXVObDIrRUY2RlRBd0JIR1JxSjkrWkpMCjhmMXorNENRYmhlSkVuajRWU245c3JvVXlRRnJ0c0tZWnJEK0lGdVFWdzhjemZyNi80dDl4WTQ3Tm1SOWQ3OFAKdno1S1BkRmZUQkxPZ3F6QWFuYXBBSTlOcXdBL2xiVHBzTkFvT3hWVmVod1UyVGV6dHc9PQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg==",
#         "client-key-data": "LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFcEFJQkFBS0NBUUVBdWQ0RUlReUxObUpVU0s1cDl4T0ZhZWRIT1RpcEJDRGNRVW8xQnJnSEY3V0xZNjRMCmFoV3JiaVp5L0JUT2JHRHZZM0Yva3lVVFo1aFpydTEyTjR4TlphWmEyQnpmTVUzNk51UGZjVUhZdVNzMm9NangKQXh4M0RKN1h4VmZpdERaTTYxWUpMZXVRaGxVQlJrNjIxbVpFbU9JRFA2RXN3TWVrMWNzb2tXczM4dFU4eUpDbQpuekZjcGNSdGo2SE1NS2Q0SHhxRU55dmY2djFHZmtRUUNsYjlaUGp0clhhVlpEKzFHaHJZcGRUMFlXUm5uRjc3CkVCWnZhaGE0RmhiL1N6bjFkR2hVcFIwd0xnaEdaNmVYN25SOTB0ZlRTU2pnZXJQS0dJYnE3eGNtbTBCZisxZ2oKU2lKQ1VwTTZHc2N0R2VCNzBiby8xNGFZRHR3anhMSHlPeUlhSndJREFRQUJBb0lCQVFDWTBZNGJqakMzMmtqcQpLVjArcEhKQkRNTm1yTXRxZFlvaXRGeTgxWG9mYUVqZkFDNnFYbjdBNWlRTVZ4OFJ4UEdPbGJjS3lLVVh2QStnCjMrVWU3dUNEL3k4YUdVTDVTdCs3V2NoUldvNVNVTkZ0aVVtQUFWdHdxUGxIYkdjZFBMZ3BsbWVkdGR6eVZkbmkKY0wycnNoSWNrVmVTYlhaYVdzdVFiS1ZDU3lHSktaaC92ZGZ0YXc4K0F6aTVNZ0ZUazlZVjc5cmU1WlVwUHowNwpIcElGZGVBd1hQOWlKK1JsU043eXVmYTkwNDVrUUhxVFNIaGJOUlhlRWxmV2VwTGEydDRmczY2UC81OHRIYlMyCm9Kb21UMEdJS1dYdzlUZWJ3eW1mb25UZm0zTlp4TitncEpNZCtpaUs4QkhySkJjQndwV3ZhZ3c2eUJobUd1a2gKTFZPb0o4Q0JBb0dCQVBjU2FKMkR6aHl2S2F0Q2lCYyt1SUREVnNDeVo5bW9FU2NTK1hSTThqWWZLMGhyVWEzSgpSMzQ1bzhKeDlOWlhaRVV5eUk1OUFsN295ZURXRFNOdHRTMVIvZGF0MzJZS2duaEczZlU3OXlqMDlzWHVtNlpVCktCZ3F2YlBhUVVmbGszTjRyVDh4bC9WSGtseE5kQUFMbHdldFc4VjJabjdZamFDRXNVTW4zaHQzQW9HQkFNQ1YKYTdXcU5MbTNLSDdIVzVtWFVXRUMxalpyNHpwNGFvWXVMUnZya3NkYlo2d2tTdXRPTlJBNW00eExESlhOUlJFVgpCbmpmR3cyQnFRVGtzZUpOQVhZQndrZGVrdFhoTFIvMDhJMDFpSE1SQmZ4THp3alpuOHRoY1ZIN0h5d3B6bnBZCjlBbW5ld3hGMnU1SU5uMDBlaHNqU1gvaTlTdytWRjZYWHRNZVQwTFJBb0dCQUpnSjZ2aXJLRVc4Z0k3VDVUMHcKcW9jS0xiTnMxYjA1MER4VVQ4K0Nuall4M2dlMWl0Qy9vTkFMRmp2TXRsYkQ5bjhpcmdvSTRWR1lQTXF2emV2MApVZDV1cXg3VlpqaTcxT2ZBN0V0QnVHbXF2TVMyZlcvUUw5QVhWUjk4K2xrTTdEek5rUWJuTk5TS1U0V2JYL3U3CkpoaGlWS3ZoblZjSFdiZmlqOVo4alJBbkFvR0FiRmFpbFR2L0ZVcllXUm5GaWczNkZkMEdyTzdja1pRVU9RL1oKQ0kvcHJvVFpPWm5oRzZhUGEyVTlBQnRvSlEycEFRY1c4UUJ4czVOeGhmTXhydUVySlR1d0UzNDhsRjFzaVVHOQo0WEp3SkdzN05zZGUzTmV3Y1RXTURsWjdIdGtWOHZYL3N6Nm9saXJtRW81Rk9RSkFmdXZHK1U2d0pnZWFadXc0CnlBT1JDMEVDZ1lBdVRVU1ArMlludXZLVGVPMGVRc0F5YzUrVmNqZjB1dHVaa3VBU3JDb0ZCWC90Q3Zsd2FVNDcKc1VQS2lwV1grS2gxUzJYMUVteUYvcGtBd1pDMnRrdEpTMjNISTBBMjNHdEt2VnN4ckRWWE0wSzlEVGI2Q0d4ZwpuU051K1lKa2RMRzJFc2hoVXFlR2xRbUFxQ28vVUpnTEpCTjB4YkZBRWs1NXhVdUZEeVFTdHc9PQotLS0tLUVORCBSU0EgUFJJVkFURSBLRVktLS0tLQo="
#       }
#     },
#     {
#       "name": "kubernetes2",
#       "user": {
#         "client-certificate-data": "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURJVENDQWdtZ0F3SUJBZ0lJY0oyQ2xXZWNMYk13RFFZSktvWklodmNOQVFFTEJRQXdGVEVUTUJFR0ExVUUKQXhNS2EzVmlaWEp1WlhSbGN6QWVGdzB5TWpBMU1Ea3dPVEl4TXpSYUZ3MHlNekExTURrd09USXhNemRhTURReApGekFWQmdOVkJBb1REbk41YzNSbGJUcHRZWE4wWlhKek1Sa3dGd1lEVlFRREV4QnJkV0psY201bGRHVnpMV0ZrCmJXbHVNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXRXQmhGSVdCTkdXOW42KzMKQUhJSU5lL0p3c0V3VzhVK29WMmFjNTU3ZnlVRUdFOFpCcWZuT2VWNEkwS2RIZ3lSaEpaeEtQa3QvdFdTN0l6egpweWw3UlFYUmM5em9tL3poeG9TWkV3bjcraEptVDNHajJsR2NkbHhYbk9DcUpIUThHZGJCU0MvS3NCWFZpWExmCkFxMUlscjYvcEZkZERaTmlqVFVKTnIrdzFTbkhtekxTcThJY3V1SXhrcFVpQU1mUWRlY0dRbnFXMGE0TkNpMmwKZkQzUUpHdUpIcW1zVzRVb0Nqb1lwOWliRVp6emJ2ZjdCYko2YUNyT3hHZmlpZjNpdGJEWUhtcDl6dW5PbDNiaQoxRmphNEhYTWptZW5oNFN1UzFNR1FzOW13ZkoyQ0U0SmNENGVXVC9BbkMyWitGNHpxdnZ4UEE1NHNPOGNaZVE1CjErRmdpUUlEQVFBQm8xWXdWREFPQmdOVkhROEJBZjhFQkFNQ0JhQXdFd1lEVlIwbEJBd3dDZ1lJS3dZQkJRVUgKQXdJd0RBWURWUjBUQVFIL0JBSXdBREFmQmdOVkhTTUVHREFXZ0JUMlk0cUpWRzArQUNmeDhyUUtGdHJPSG1hQwppekFOQmdrcWhraUc5dzBCQVFzRkFBT0NBUUVBZ3F2UHJsbEtCenRsRXNUeEpEaGNObEdaYzlhNXU4K0ZBRXNSCjBGOWdXSU5tRDZnVFhZd2tBaHFpaHNPSUFjZDE0dEFvRmZ2NDExdVdDS05kS1dPNTdZRjNSOWVEZlBaQndjN1QKWW9DM1hJK1FTdjNiY1ZpTjZIOHlGaFVVeGFKVmEzbjFPekVFRjczaHBaSDRZdk5UUW5zcnczcG9zMW9QOHRsawpJRHg4YTBrSDVGODR6ZWE1eWd3alRlTk45eDVCS05SZVcwSzVvcW54NXlRcER3ZGxlQW9hVU9sK0cyZ3NHMHppCkhNbUpJMkkvaWNDMDdZWEI5cDQybFJCTTE4bm9mUlJ3cWx6bGNJa1A2em5kU3Z5SS9VK2Q1aWhXeCtaVWJudnkKWFVGemt3QTVNN3NUa1lkU1hvMWsvY0VvRnBDbGpOaDRlNTExaGVISUlPdzY2VXpDWEE9PQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg==",
#         "client-key-data": "LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFb2dJQkFBS0NBUUVBdFdCaEZJV0JOR1c5bjYrM0FISUlOZS9Kd3NFd1c4VStvVjJhYzU1N2Z5VUVHRThaCkJxZm5PZVY0STBLZEhneVJoSlp4S1BrdC90V1M3SXp6cHlsN1JRWFJjOXpvbS96aHhvU1pFd243K2hKbVQzR2oKMmxHY2RseFhuT0NxSkhROEdkYkJTQy9Lc0JYVmlYTGZBcTFJbHI2L3BGZGREWk5palRVSk5yK3cxU25IbXpMUwpxOEljdXVJeGtwVWlBTWZRZGVjR1FucVcwYTROQ2kybGZEM1FKR3VKSHFtc1c0VW9Dam9ZcDlpYkVaenpidmY3CkJiSjZhQ3JPeEdmaWlmM2l0YkRZSG1wOXp1bk9sM2JpMUZqYTRIWE1qbWVuaDRTdVMxTUdRczltd2ZKMkNFNEoKY0Q0ZVdUL0FuQzJaK0Y0enF2dnhQQTU0c084Y1plUTUxK0ZnaVFJREFRQUJBb0lCQUhpUFNiaEVUVyt3dU94dAo5ZXhiMzgxS1NBZ21OYWlxWVVrTldON0ZWejFhTTNDZEV2dHptNlRHUEtialhtQmM1bFVGVXM1ell2bGlxVGlICk1HWEtrdDk4VUk3OUpiaVp6TkVSemxYemF3UDhPdmxQaGlSVjN2Umx5TzdEL3hRZ0Z0cnQvcWVtN01sQ21oKzAKdFR1b1J2bThiTkltSi9vZ0gzL1E0d0Q3UmVWSnNqSmFxRFV5dnVsc0ZDVlJKNGNWVW1ueVhxR1c5VXFiQ2NSNgpCT0pITjh4N25qWFBNWUxWTWtCbWdHbElBdGtmL29qSzhQb0lRcW5mS3huUEVPTGQ1UUZUNGtOYm95SlEvRHFoCks0R1RMcjFldjNlU3NPVUxwSnVUdklGT0FZQU56ZE95RjhFbjdHbUg4N3YyVTZzcDFGM1RuRDVZdFBSZWoraTQKZEVlUUhxa0NnWUVBd3M5VTBWZ01yaC9ZQ2M2K3ZQRjdKVzJ4NncxTnU1MGp0dUlwSTJtV3gwUUM1UThNclVDMQpiNTYxekdnVzlXYVFMVHhHQ1lVSTZ0Znk0RDdic1ZIczVkazJYZ1poUnNJb1Z5aWJPSnp5Q0lIRGxoOW5tbUM5CndMYXBlU01TZFVCUThKNFJrQzV6VjFiWW1DRXZ0K1c1Zlp3bVhWcGlQeVpXUkJSK2xTSWhZR01DZ1lFQTdsamUKQm4vVFF1M2NHN0tsZStzdEtRaEwvNWxzRElaZ2loWGxLbWNjamx4K0VDdjZSbktPejl2SzBER09Uc1RVOHA4QgpZcjJTb0RxVm43S244eHBXWjJMMGhyaXhmQ3Z2eTRyWXFzQ3dTa2xGMUhlcFdCU3BkdU5aVzRyTDQ1RUlMUHhSCnVock8zcjRkSU1WTzBhVUYwZmxsY3o0aGdRSGNlK1RMT01wYzhTTUNnWUEyMC8yT01kYlh4dlNaeGd0ZXlDUWQKbzZMNGdiVUlBYkVFanVCL0svK1lzNmFRNjB4cEVwWStCUkFycUh3VnN6a08wakR3Q3ZZNGluQzc5bFVFc2djWApwYXVzaU9VbDhnMUNncFkxTjg3UzRCcTVETHV1OGwxVmVOTjMyWXdmWGV1cDNRTWFia2hlSTM0d1N0N1FSaUtQCm5Md2JlQTNBc2p5RFNyVlpxZEowK3dLQmdEdVRNT1BVL1h4RU1ma21YU0N0TnR1RHZHTkYrUERrZ2FyaU1DYTYKSVRRZ1FFNVFmNzB1RXk0M1ZPbFhDYWY4b1BHSDl2TzBTTHNPQ2FvaUlNS3QrWnpiNmh6bWUwNTdPUFBhWDYvRwpmQW9GYUpQajJRc3dGdStsZ2dkVW1RUG5rM0NUSE9aMG52S2orR25oaDRMMVNaQWpVMDFMNFZuNm1oN0pvRll3CmxxeWJBb0dBTDViT0JuNEd6SS92anVHczd3YTFNMGFlQ0hSYldPdUJmMXBSRUltR2JXNE91QU9BQmZHdTlPRGoKeUVkanVlRSszOW9tYzMzZitYWi9Cdk5HREZ3Q2tPQzRYRnVEZWhPeG4zaCtjbjg2Zzl3N3lOVDF2U1R2VVk1ZQorc295NUFTQUxJVElxRlJlQ1YwczlUdDlVVGtiSUI0Z240R0N5WVdmNUVTbXM2OG9hUkE9Ci0tLS0tRU5EIFJTQSBQUklWQVRFIEtFWS0tLS0tCg=="
#       }
#     }
#   ]
# }
config.load_kube_config_from_dict(configK8s)

timeout = 30

ureg = UnitRegistry()
Q_ = ureg.Quantity
# Memory units
ureg.define('kmemunits = 1 = [kmemunits]')
ureg.define('Ki = 1024 * kmemunits')
ureg.define('Mi = Ki^2')
ureg.define('Gi = Ki^3')
ureg.define('Ti = Ki^4')
ureg.define('Pi = Ki^5')
ureg.define('Ei = Ki^6')

# cpu units
ureg.define('kcpuunits = 1 = [kcpuunits]')
ureg.define('m = 1/1000 * kcpuunits')
ureg.define('k = 1000 * kcpuunits')
ureg.define('M = k^2')
ureg.define('G = k^3')
ureg.define('T = k^4')
ureg.define('P = k^5')
ureg.define('E = k^6')

def getMaximumReplicas(cluster, app_cpu_request, app_memory_request):
    # print("Get the maximum number of replicas > 0 clusters can run ....")
    totalAvailableCPU, totalAvailableMemory, available_resources_per_node = compute_available_resources(cluster)

    count = 0

    for node in available_resources_per_node:
        count += min(math.floor(node['cpu']/app_cpu_request), math.floor(node['memory']/app_memory_request))

    return count

def compute_available_resources(cluster):

    total_allocatable_cpu = 0
    total_allocatable_memory = 0

    available_cpu = 0
    available_memory = 0

    total_cpu_request = 0
    total_memory_request = 0

    core_v1 = client.CoreV1Api(api_client=config.new_client_from_config_dict(config_dict=configK8s,context=cluster))

    available_resources_per_node = []

    try:
        for node in core_v1.list_node(_request_timeout=timeout).items[0:]:
            stats          = {}
            node_name      = node.metadata.name
            allocatable    = node.status.allocatable
            allocatabale_cpu = Q_(allocatable['cpu']).to('m')
            allocatable_memory = Q_(allocatable['memory'])
            total_allocatable_cpu += allocatabale_cpu
            total_allocatable_memory += allocatable_memory
            max_pods       = int(int(allocatable["pods"]) * 1.5)
            field_selector = ("status.phase!=Succeeded,status.phase!=Failed," +
                              "spec.nodeName=" + node_name)

            node_cpu_request = 0
            node_memory_request = 0

            pods = core_v1.list_pod_for_all_namespaces(limit=max_pods,
                                                       field_selector=field_selector).items
            cpureqs, memreqs = [], []
            for pod in pods:
                for container in pod.spec.containers:
                    res = container.resources
                    reqs = defaultdict(lambda: 0, res.requests or {})
                    cpureqs.append(Q_(reqs["cpu"]))
                    memreqs.append(Q_(reqs["memory"]))

            node_cpu_request += sum(cpureqs) #???
            node_memory_request += sum(memreqs)

            dict = {}
            # node_memory_request.to('Ki') probar a hacerlo antes de la resta siguiente a ver si el valor
            dict['name'] = node_name
            dict['cpu'] = float(allocatabale_cpu - node_cpu_request) * 1000 # Como hace esta operacion??
            dict['memory'] = float(str(allocatable_memory - node_memory_request)[:-2])
            available_resources_per_node.append(dict)

            total_cpu_request += Q_(node_cpu_request)
            total_memory_request += Q_(node_memory_request).to('Ki')
        available_cpu = total_allocatable_cpu - total_cpu_request
        available_memory = total_allocatable_memory - total_memory_request

        available_cpu = float(str(available_cpu)[:-2])
        available_memory = float(str(available_memory)[:-3])
    except:
        print("Connection timeout after " + str(timeout) + " seconds on cluster " + cluster)
    return available_cpu, available_memory, available_resources_per_node

def getPerNodeResources(cluster):

    perNodeCPU = 0
    perNodeMemory = 0

    client_cluster = client.CoreV1Api(api_client=config.new_client_from_config_dict(config_dict=configK8s,context=cluster))

    try:
        nodes = client_cluster.list_node(_request_timeout=timeout)

        perNodeCPU = Q_(nodes.items[0].status.capacity['cpu']).to('m')
        perNodeMemory = Q_(nodes.items[0].status.capacity['memory']).to('Ki')
        perNodeCPU = float(str(perNodeCPU)[:-2])
        perNodeMemory = float(str(perNodeMemory)[:-3])
    except:
        print("Connection timeout after " + str(timeout) + " seconds to " + cluster)

    return perNodeCPU, perNodeMemory

def checkClusterPossibility(cluster, app_cpu_request, app_memory_request):
    cluster_per_node_cpu, cluster_per_node_memory = getPerNodeResources(cluster)
    if app_cpu_request >= cluster_per_node_cpu or app_memory_request >= cluster_per_node_memory:
        return False
    else:
        return True

def get_all_federation_clusters():
    config.load_kube_config_from_dict(configK8s)

    clusters = []

    for item in configK8s['clusters']:
        clusters.append(item['name'])

    return clusters

def getControllerMasterIP():
    
    # TO DO: Specify cluster 0
    config.load_kube_config_from_dict(configK8s)
    #api = client.CoreV1Api(api_client=config.new_client_from_config(context="cluster0"))
    api = client.CoreV1Api()
    master_ip = ""
    try:
        nodes = api.list_node(pretty=True, _request_timeout=timeout)
        nodes = [node for node in nodes.items if
                 'node-role.kubernetes.io/master' in node.metadata.labels]
        # get all addresses of the master
        addresses = nodes[0].status.addresses

        master_ip = [i.address for i in addresses if i.type == "InternalIP"][0]
    except:
        print("Connection timeout after " + str(timeout) + " seconds to host cluster")

    return master_ip

def getFogAppLocations(app_cpu_request, app_memory_request, replicas, clusters_qty, placement_policy, mode):
    master_ip = getControllerMasterIP()
    prom_host = os.getenv("PROMETHEUS_DEMO_SERVICE_SERVICE_HOST", master_ip)
    prom_port = os.getenv("PROMETHEUS_DEMO_SERVICE_SERVICE_PORT", "30000")
    prom_url = "http://" + prom_host + ":" + prom_port

    # Creating the prometheus connect object with the required parameters
    pc = PrometheusConnect(url=prom_url, disable_ssl=True)

    # TO DO get all federation clusters except cloud
    all_clusters = get_all_federation_clusters()

    # print("List of all clusters ................", all_clusters)

    fog_only_clusters = []
    for cluster in all_clusters:
        if 'cloud' not in cluster:
            fog_only_clusters.append(cluster)

    # print("Fog - only clusters .....", fog_only_clusters)

    cluster_network_receive = {}

    possible_clusters = []
    for cluster in fog_only_clusters:
        if checkClusterPossibility(cluster, app_cpu_request, app_memory_request) == True:
            possible_clusters.append(cluster)
    # print("List of possible clusters ..............", possible_clusters)

    eligible_clusters = []
    if len(possible_clusters) == 0:
        eligible_clusters = []
    else:
        for cluster in possible_clusters:
            # if checkClusterEligibility(cluster, app_cpu_request, app_memory_request, replicas) == True:
            #     eligible_clusters.append(cluster)
            # Get eligible clusters and their maximum capacity
            if mode == 'create':
                maximum_replicas = getMaximumReplicas(cluster, app_cpu_request, app_memory_request)

            if maximum_replicas > 0:
                dict = {}

                dict['name'] = cluster
                dict['max_replicas'] = maximum_replicas
                eligible_clusters.append(dict)

    # print("List of Eligible clusters ..............", eligible_clusters)

    if len(eligible_clusters) == 0:
        fogapp_locations = []
        all_clusters = get_all_federation_clusters()

        for cluster in all_clusters:
            if 'cloud' in cluster:
                dict = {}
                dict['name'] = cluster
                dict['max_replicas'] = replicas * clusters_qty
                fogapp_locations.append(dict)
        return fogapp_locations
    else:
        sorted_eligible_clusters = []
        if placement_policy == 'most_traffic' or placement_policy == 'most-traffic':
            for cluster in eligible_clusters:
                if mode == 'create':
                    query = "sum(instance:node_network_receive_bytes_excluding_lo:rate5m{cluster_name='" + cluster['name'] + "'})"

                # Here, we are fetching the values of a particular metric name
                result = pc.custom_query(query=query)

                #cluster_network_receive[cluster['name']] = float(result[0]['value'][1])
                if len(result) > 0:
                    cluster['ntk_rcv'] = float(result[0]['value'][1])
                else:
                    cluster['ntk_rcv'] = 0.0

            # sorted_dict = dict(sorted(cluster_network_receive.items(),
            #                           key=operator.itemgetter(1),
            #                           reverse=True))

            sorted_eligible_clusters = sorted(eligible_clusters, key = lambda i: i['ntk_rcv'], reverse=True)
        elif placement_policy == 'worst_fit' or placement_policy == 'worst-fit':
            sorted_eligible_clusters = sorted(eligible_clusters, key=lambda i: i['max_replicas'], reverse=True)
        elif placement_policy == 'best_fit' or placement_policy == 'best-fit':
            sorted_eligible_clusters = sorted(eligible_clusters, key=lambda i: i['max_replicas'])

        # print("List of sorted traffic and policy ....", sorted_eligible_clusters)

        fogapp_locations = []

        for cluster in sorted_eligible_clusters:
            dict = {}
            dict['name'] = cluster['name']
            dict['max_replicas'] = cluster['max_replicas']
            fogapp_locations.append(dict)

        # for key in sorted_dict:
        #     fogapp_locations.append(key)

        all_clusters = get_all_federation_clusters()
        # if 'cloud' in all_clusters:
        #     fogapp_locations.append('cloud')
        for cluster in all_clusters:
            if 'cloud' in cluster:
                dict = {}
                dict['name'] = cluster
                dict['max_replicas'] = replicas
                fogapp_locations.append(dict)

        # print("Final list of clusters which will host the app in the Default case ....", fogapp_locations)

        #fogapp_locations = fogapp_locations[:clusters_qty]
        return fogapp_locations

def getCloudCluster():
    all_clusters = get_all_federation_clusters()
    cloud_cluster = ''
    for cluster in all_clusters:
        if 'cloud' in cluster:
            cloud_cluster = cluster
    return cloud_cluster

def normalizeData(cpu,memory):
    sumCpu = 0
    sumMemory = 0

    for cpu_request in cpu:
        if (str.isnumeric(cpu_request)):
            sumCpu += float(cpu_request)*1000
        else:
            sumCpu += float(str(float(cpu_request[:-1])*ureg(cpu_request[-1:]).to('m'))[:-2])
    
    for memory_request in memory:
            sumMemory += float(str(float(memory_request[:-2])*ureg(memory_request[-2:]).to('Ki'))[:-3])

    return sumCpu,sumMemory
