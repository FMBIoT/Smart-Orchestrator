import { Container, Service, Inject } from 'typedi';
import {load,dump} from 'js-yaml'
import MongoService from './mongoService'
import config from '../../config';
import ResponseFormatJob from '../../jobs/responseFormat';
import * as k8s from '@kubernetes/client-node';
import {v4 as uuidv4} from 'uuid';

const kc = new k8s.KubeConfig();
// const kubeconfig = JSON.stringify({
//   "apiVersion": "v1",
//   "clusters": [
//     {
//       "cluster": {
//         "certificate-authority-data": "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUMvakNDQWVhZ0F3SUJBZ0lCQURBTkJna3Foa2lHOXcwQkFRc0ZBREFWTVJNd0VRWURWUVFERXdwcmRXSmwKY201bGRHVnpNQjRYRFRJeU1EWXdNekV5TkRBME0xb1hEVE15TURVek1URXlOREEwTTFvd0ZURVRNQkVHQTFVRQpBeE1LYTNWaVpYSnVaWFJsY3pDQ0FTSXdEUVlKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBTnA0CjRUQ2MwSWRNMCt2NDBYU0FDNU9HSDhLMUV2TjFiL3FBRkVVREM1aWtIV0tsbXQ2dS9YbTZDTHphU2ZBaDRzWE4Kc1JHVHJucXRIT3hYbStNQ2RudUdKdDArVlpLMWIzQTcrV0YxSUlJanpBVHNmTDNzUUFDcWxtMWRSa3dNSEQ4UQorOUJrMU43NVY5cFR4eGcrbDBtWlhxbUZYOHhEanFIbDd6ZzduOUlkVGFzU3pBaS9xQ2xidmxSUHJuUWVuUDZ2CmNUY3A0aHg5WU9OakRDQVBVcTlqdE9ZUHpGL1hzb0c2SWpkV3BRbk1GcmVVLzYrQ0pYak0rQVJZMW4xTkZHblMKK0FVeXgycVYvOVU3OHc1cHBELzZFMC9MS0ZIclFOYXNUQ0tuNEs3bGlRQVRoTEVyQlY0bHovcXIzS2tOaXJzVApRRFVGbi81L0NFSDZhSU8yRFE4Q0F3RUFBYU5aTUZjd0RnWURWUjBQQVFIL0JBUURBZ0trTUE4R0ExVWRFd0VCCi93UUZNQU1CQWY4d0hRWURWUjBPQkJZRUZPdldweDRNREJSQ0RsSEJGdEpBOW9hL1IwNGpNQlVHQTFVZEVRUU8KTUF5Q0NtdDFZbVZ5Ym1WMFpYTXdEUVlKS29aSWh2Y05BUUVMQlFBRGdnRUJBQmNYMERrUE9uQXEwMTZPa2VIbAo2VSsrT1JodkVQUU1SbkJYWW1TdHlnMWQyZ1IxelZvWW5zbmxVcnJNWlZzOHZYN21zekViVEg4aENiNjBQczFVCldXQ3I3bHVUbG5JSFhtalNGRXZNU3Q5eHdzZE1HNHR4MkhibmdCQVJnM3BpK1dsdXB0YVdKVC8xck1nM3ZETzUKbm96d3ZseFVEbEdNYnpSTFQ4Q0cxRk5uN1hIMFlFVHlSWGN5YkxaUm1oZVdxaU4xKzhyVkN4S05xQ2pWVHgreAptanJWc0k3U1lrNzVEWjBGNC9IYnE3WG5kdlBKVFg3elM2UkR5MkEvc0hZTTlOdCtYUDl6Z3JiYm1Yb3FJYXpSCkpqSW5KMkxFSVEyNGFCVXBKRzhtYjc1aHloN3M2VldJbE14Skd3UUFSWTg2cjRTOS95MmxUREc0TWpIVTQ0bk0KS2FZPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg==",
//         "server": "https://192.168.250.176:6443"
//       },
//       "name": "kubernetes"
//     },
//     {
//       "cluster": {
//         "certificate-authority-data": "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUMvakNDQWVhZ0F3SUJBZ0lCQURBTkJna3Foa2lHOXcwQkFRc0ZBREFWTVJNd0VRWURWUVFERXdwcmRXSmwKY201bGRHVnpNQjRYRFRJeU1EVXdPVEE1TWpFek5Gb1hEVE15TURVd05qQTVNakV6TkZvd0ZURVRNQkVHQTFVRQpBeE1LYTNWaVpYSnVaWFJsY3pDQ0FTSXdEUVlKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBTWdhCjZ0YytGMmpOMTMzMy82clpjMkRpQW5pVWZDcC9BcEVRWTdJOGxsTE5RTTJab3VybThuc01kWXZwY3hQdzRkYmUKQkE3enNWNHBGejcxVTRtWUFaTUE0NjRxaFNFTTRZRFBBQjJ3NDdNWk1xOWd3bk5HY09oQkpHblIraGRxeVJzdApOTG9IK1lRR0FhSmd2dWpOY3hxOTJIKyswV2N2QkNPRWxVbDNad09YM1MrWnRkNVNQSHEyWXJnRCswTXZHcHpmCjI2aUNLWVkzOTNIb2htK2N1MlVwVy9ZTi91b2hQVTRNRXduNHZEOGxhN0ZCWWgwdThORFFCS2dwMVdleGlrOXIKSzlhWlR6TlVYYjFNa2MyUWRpRm1pWTQxN1FmcWZCVUxpbnFndWZaTTBXZnFWeFdiWkdRWlVlR05DUmMyMTYwdwo3SnJnWXVCd2ZRL2ZlOVI3SEUwQ0F3RUFBYU5aTUZjd0RnWURWUjBQQVFIL0JBUURBZ0trTUE4R0ExVWRFd0VCCi93UUZNQU1CQWY4d0hRWURWUjBPQkJZRUZQWmppb2xVYlQ0QUovSHl0QW9XMnM0ZVpvS0xNQlVHQTFVZEVRUU8KTUF5Q0NtdDFZbVZ5Ym1WMFpYTXdEUVlKS29aSWh2Y05BUUVMQlFBRGdnRUJBQTFYL2UrM2xSTUJBL0N6SmN4Nwo2ZG1LQTFIRUQ3bldoN2hqbFY4TDEvR2t5SUxjMHZRNjhjQ2FmRVNWT085VjJuUVVndzQ4VURnMDVZL2lYUDZUCjhPZzcvV1RnMFUvb05vYStGNGRseGxGSmdFYi96NDJBVlFMMy9BKzR4dk1CTTNZTkMxUlE3ZlBsc3JXZ0hWU2kKcG52dXU0NHRsNmsraE1FLzlMaTl1NG1JZGJITHRVK04wMngybnVyRUFCSHIrVmdyUC9MTHhjSWlJSkRwWlBuUwpmM3hWc1EyUUhGWFFlTkdPckIxUDkwbGQ0dlRKL3psdkVZMC9qaGp0L09WTFM2MWJLdWFzZkRBeHpxc3VFbFZECm1QSExsRGVIU3lBeitSVXJXVXdwS2lOdy9XZ2JISWdWbzB3WmJrdnV5VVBSamNabnhEemhZc083YjlUMEFxNmYKYzVjPQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg==",
//         "server": "https://192.168.250.200:6443"
//       },
//       "name": "kubernetes2"
//     }
//   ],
//   "contexts": [
//     {
//       "context": {
//         "cluster": "kubernetes",
//         "user": "kubernetes1"
//       },
//       "name": "kubernetes"
//     },
//     {
//       "context": {
//         "cluster": "kubernetes2",
//         "user": "kubernetes2"
//       },
//       "name": "kubernetes2"
//     }
//   ],
//   "current-context": "kubernetes",
//   "kind": "Config",
//   "preferences": {},
//   "users": [
//     {
//       "name": "kubernetes1",
//       "user": {
//         "client-certificate-data": "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURJVENDQWdtZ0F3SUJBZ0lJSW02L2ZPNGkrTGN3RFFZSktvWklodmNOQVFFTEJRQXdGVEVUTUJFR0ExVUUKQXhNS2EzVmlaWEp1WlhSbGN6QWVGdzB5TWpBMk1ETXhNalF3TkROYUZ3MHlNekEyTURNeE1qUXdORFZhTURReApGekFWQmdOVkJBb1REbk41YzNSbGJUcHRZWE4wWlhKek1Sa3dGd1lEVlFRREV4QnJkV0psY201bGRHVnpMV0ZrCmJXbHVNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXVkNEVJUXlMTm1KVVNLNXAKOXhPRmFlZEhPVGlwQkNEY1FVbzFCcmdIRjdXTFk2NExhaFdyYmlaeS9CVE9iR0R2WTNGL2t5VVRaNWhacnUxMgpONHhOWmFaYTJCemZNVTM2TnVQZmNVSFl1U3Myb01qeEF4eDNESjdYeFZmaXREWk02MVlKTGV1UWhsVUJSazYyCjFtWkVtT0lEUDZFc3dNZWsxY3Nva1dzMzh0VTh5SkNtbnpGY3BjUnRqNkhNTUtkNEh4cUVOeXZmNnYxR2ZrUVEKQ2xiOVpQanRyWGFWWkQrMUdocllwZFQwWVdSbm5GNzdFQlp2YWhhNEZoYi9Tem4xZEdoVXBSMHdMZ2hHWjZlWAo3blI5MHRmVFNTamdlclBLR0licTd4Y21tMEJmKzFnalNpSkNVcE02R3NjdEdlQjcwYm8vMTRhWUR0d2p4TEh5Ck95SWFKd0lEQVFBQm8xWXdWREFPQmdOVkhROEJBZjhFQkFNQ0JhQXdFd1lEVlIwbEJBd3dDZ1lJS3dZQkJRVUgKQXdJd0RBWURWUjBUQVFIL0JBSXdBREFmQmdOVkhTTUVHREFXZ0JUcjFxY2VEQXdVUWc1UndSYlNRUGFHdjBkTwpJekFOQmdrcWhraUc5dzBCQVFzRkFBT0NBUUVBdFhZK3RKUVQzUHdDVElsbXdiNnRIRXF2eXN6UE9oTk1PRzRsCnJUL29hd20xa1M1eFRrRzkwREJSYXBzZjlDMlBpb1F3b3kyVkRocldUVW1ISXQ0MVc2ci9RL21ZV1pDM1RmL1UKMUVtMUVGM1ozSDdwdWNQVkowbHdhMkNENTdxdmRlcXZWT29VL2k0TzRiTlhrOUtYM2o3Z1lhOTNqSC9kMWV1LwpBNGlIUk1wcXY5OGZLYUdWMWJ4MWV0N1kxdGk0WGNxNjlyVitLdm0xYXVObDIrRUY2RlRBd0JIR1JxSjkrWkpMCjhmMXorNENRYmhlSkVuajRWU245c3JvVXlRRnJ0c0tZWnJEK0lGdVFWdzhjemZyNi80dDl4WTQ3Tm1SOWQ3OFAKdno1S1BkRmZUQkxPZ3F6QWFuYXBBSTlOcXdBL2xiVHBzTkFvT3hWVmVod1UyVGV6dHc9PQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg==",
//         "client-key-data": "LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFcEFJQkFBS0NBUUVBdWQ0RUlReUxObUpVU0s1cDl4T0ZhZWRIT1RpcEJDRGNRVW8xQnJnSEY3V0xZNjRMCmFoV3JiaVp5L0JUT2JHRHZZM0Yva3lVVFo1aFpydTEyTjR4TlphWmEyQnpmTVUzNk51UGZjVUhZdVNzMm9NangKQXh4M0RKN1h4VmZpdERaTTYxWUpMZXVRaGxVQlJrNjIxbVpFbU9JRFA2RXN3TWVrMWNzb2tXczM4dFU4eUpDbQpuekZjcGNSdGo2SE1NS2Q0SHhxRU55dmY2djFHZmtRUUNsYjlaUGp0clhhVlpEKzFHaHJZcGRUMFlXUm5uRjc3CkVCWnZhaGE0RmhiL1N6bjFkR2hVcFIwd0xnaEdaNmVYN25SOTB0ZlRTU2pnZXJQS0dJYnE3eGNtbTBCZisxZ2oKU2lKQ1VwTTZHc2N0R2VCNzBiby8xNGFZRHR3anhMSHlPeUlhSndJREFRQUJBb0lCQVFDWTBZNGJqakMzMmtqcQpLVjArcEhKQkRNTm1yTXRxZFlvaXRGeTgxWG9mYUVqZkFDNnFYbjdBNWlRTVZ4OFJ4UEdPbGJjS3lLVVh2QStnCjMrVWU3dUNEL3k4YUdVTDVTdCs3V2NoUldvNVNVTkZ0aVVtQUFWdHdxUGxIYkdjZFBMZ3BsbWVkdGR6eVZkbmkKY0wycnNoSWNrVmVTYlhaYVdzdVFiS1ZDU3lHSktaaC92ZGZ0YXc4K0F6aTVNZ0ZUazlZVjc5cmU1WlVwUHowNwpIcElGZGVBd1hQOWlKK1JsU043eXVmYTkwNDVrUUhxVFNIaGJOUlhlRWxmV2VwTGEydDRmczY2UC81OHRIYlMyCm9Kb21UMEdJS1dYdzlUZWJ3eW1mb25UZm0zTlp4TitncEpNZCtpaUs4QkhySkJjQndwV3ZhZ3c2eUJobUd1a2gKTFZPb0o4Q0JBb0dCQVBjU2FKMkR6aHl2S2F0Q2lCYyt1SUREVnNDeVo5bW9FU2NTK1hSTThqWWZLMGhyVWEzSgpSMzQ1bzhKeDlOWlhaRVV5eUk1OUFsN295ZURXRFNOdHRTMVIvZGF0MzJZS2duaEczZlU3OXlqMDlzWHVtNlpVCktCZ3F2YlBhUVVmbGszTjRyVDh4bC9WSGtseE5kQUFMbHdldFc4VjJabjdZamFDRXNVTW4zaHQzQW9HQkFNQ1YKYTdXcU5MbTNLSDdIVzVtWFVXRUMxalpyNHpwNGFvWXVMUnZya3NkYlo2d2tTdXRPTlJBNW00eExESlhOUlJFVgpCbmpmR3cyQnFRVGtzZUpOQVhZQndrZGVrdFhoTFIvMDhJMDFpSE1SQmZ4THp3alpuOHRoY1ZIN0h5d3B6bnBZCjlBbW5ld3hGMnU1SU5uMDBlaHNqU1gvaTlTdytWRjZYWHRNZVQwTFJBb0dCQUpnSjZ2aXJLRVc4Z0k3VDVUMHcKcW9jS0xiTnMxYjA1MER4VVQ4K0Nuall4M2dlMWl0Qy9vTkFMRmp2TXRsYkQ5bjhpcmdvSTRWR1lQTXF2emV2MApVZDV1cXg3VlpqaTcxT2ZBN0V0QnVHbXF2TVMyZlcvUUw5QVhWUjk4K2xrTTdEek5rUWJuTk5TS1U0V2JYL3U3CkpoaGlWS3ZoblZjSFdiZmlqOVo4alJBbkFvR0FiRmFpbFR2L0ZVcllXUm5GaWczNkZkMEdyTzdja1pRVU9RL1oKQ0kvcHJvVFpPWm5oRzZhUGEyVTlBQnRvSlEycEFRY1c4UUJ4czVOeGhmTXhydUVySlR1d0UzNDhsRjFzaVVHOQo0WEp3SkdzN05zZGUzTmV3Y1RXTURsWjdIdGtWOHZYL3N6Nm9saXJtRW81Rk9RSkFmdXZHK1U2d0pnZWFadXc0CnlBT1JDMEVDZ1lBdVRVU1ArMlludXZLVGVPMGVRc0F5YzUrVmNqZjB1dHVaa3VBU3JDb0ZCWC90Q3Zsd2FVNDcKc1VQS2lwV1grS2gxUzJYMUVteUYvcGtBd1pDMnRrdEpTMjNISTBBMjNHdEt2VnN4ckRWWE0wSzlEVGI2Q0d4ZwpuU051K1lKa2RMRzJFc2hoVXFlR2xRbUFxQ28vVUpnTEpCTjB4YkZBRWs1NXhVdUZEeVFTdHc9PQotLS0tLUVORCBSU0EgUFJJVkFURSBLRVktLS0tLQo="
//       }
//     },
//     {
//       "name": "kubernetes2",
//       "user": {
//         "client-certificate-data": "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURJVENDQWdtZ0F3SUJBZ0lJY0oyQ2xXZWNMYk13RFFZSktvWklodmNOQVFFTEJRQXdGVEVUTUJFR0ExVUUKQXhNS2EzVmlaWEp1WlhSbGN6QWVGdzB5TWpBMU1Ea3dPVEl4TXpSYUZ3MHlNekExTURrd09USXhNemRhTURReApGekFWQmdOVkJBb1REbk41YzNSbGJUcHRZWE4wWlhKek1Sa3dGd1lEVlFRREV4QnJkV0psY201bGRHVnpMV0ZrCmJXbHVNSUlCSWpBTkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXRXQmhGSVdCTkdXOW42KzMKQUhJSU5lL0p3c0V3VzhVK29WMmFjNTU3ZnlVRUdFOFpCcWZuT2VWNEkwS2RIZ3lSaEpaeEtQa3QvdFdTN0l6egpweWw3UlFYUmM5em9tL3poeG9TWkV3bjcraEptVDNHajJsR2NkbHhYbk9DcUpIUThHZGJCU0MvS3NCWFZpWExmCkFxMUlscjYvcEZkZERaTmlqVFVKTnIrdzFTbkhtekxTcThJY3V1SXhrcFVpQU1mUWRlY0dRbnFXMGE0TkNpMmwKZkQzUUpHdUpIcW1zVzRVb0Nqb1lwOWliRVp6emJ2ZjdCYko2YUNyT3hHZmlpZjNpdGJEWUhtcDl6dW5PbDNiaQoxRmphNEhYTWptZW5oNFN1UzFNR1FzOW13ZkoyQ0U0SmNENGVXVC9BbkMyWitGNHpxdnZ4UEE1NHNPOGNaZVE1CjErRmdpUUlEQVFBQm8xWXdWREFPQmdOVkhROEJBZjhFQkFNQ0JhQXdFd1lEVlIwbEJBd3dDZ1lJS3dZQkJRVUgKQXdJd0RBWURWUjBUQVFIL0JBSXdBREFmQmdOVkhTTUVHREFXZ0JUMlk0cUpWRzArQUNmeDhyUUtGdHJPSG1hQwppekFOQmdrcWhraUc5dzBCQVFzRkFBT0NBUUVBZ3F2UHJsbEtCenRsRXNUeEpEaGNObEdaYzlhNXU4K0ZBRXNSCjBGOWdXSU5tRDZnVFhZd2tBaHFpaHNPSUFjZDE0dEFvRmZ2NDExdVdDS05kS1dPNTdZRjNSOWVEZlBaQndjN1QKWW9DM1hJK1FTdjNiY1ZpTjZIOHlGaFVVeGFKVmEzbjFPekVFRjczaHBaSDRZdk5UUW5zcnczcG9zMW9QOHRsawpJRHg4YTBrSDVGODR6ZWE1eWd3alRlTk45eDVCS05SZVcwSzVvcW54NXlRcER3ZGxlQW9hVU9sK0cyZ3NHMHppCkhNbUpJMkkvaWNDMDdZWEI5cDQybFJCTTE4bm9mUlJ3cWx6bGNJa1A2em5kU3Z5SS9VK2Q1aWhXeCtaVWJudnkKWFVGemt3QTVNN3NUa1lkU1hvMWsvY0VvRnBDbGpOaDRlNTExaGVISUlPdzY2VXpDWEE9PQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg==",
//         "client-key-data": "LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFb2dJQkFBS0NBUUVBdFdCaEZJV0JOR1c5bjYrM0FISUlOZS9Kd3NFd1c4VStvVjJhYzU1N2Z5VUVHRThaCkJxZm5PZVY0STBLZEhneVJoSlp4S1BrdC90V1M3SXp6cHlsN1JRWFJjOXpvbS96aHhvU1pFd243K2hKbVQzR2oKMmxHY2RseFhuT0NxSkhROEdkYkJTQy9Lc0JYVmlYTGZBcTFJbHI2L3BGZGREWk5palRVSk5yK3cxU25IbXpMUwpxOEljdXVJeGtwVWlBTWZRZGVjR1FucVcwYTROQ2kybGZEM1FKR3VKSHFtc1c0VW9Dam9ZcDlpYkVaenpidmY3CkJiSjZhQ3JPeEdmaWlmM2l0YkRZSG1wOXp1bk9sM2JpMUZqYTRIWE1qbWVuaDRTdVMxTUdRczltd2ZKMkNFNEoKY0Q0ZVdUL0FuQzJaK0Y0enF2dnhQQTU0c084Y1plUTUxK0ZnaVFJREFRQUJBb0lCQUhpUFNiaEVUVyt3dU94dAo5ZXhiMzgxS1NBZ21OYWlxWVVrTldON0ZWejFhTTNDZEV2dHptNlRHUEtialhtQmM1bFVGVXM1ell2bGlxVGlICk1HWEtrdDk4VUk3OUpiaVp6TkVSemxYemF3UDhPdmxQaGlSVjN2Umx5TzdEL3hRZ0Z0cnQvcWVtN01sQ21oKzAKdFR1b1J2bThiTkltSi9vZ0gzL1E0d0Q3UmVWSnNqSmFxRFV5dnVsc0ZDVlJKNGNWVW1ueVhxR1c5VXFiQ2NSNgpCT0pITjh4N25qWFBNWUxWTWtCbWdHbElBdGtmL29qSzhQb0lRcW5mS3huUEVPTGQ1UUZUNGtOYm95SlEvRHFoCks0R1RMcjFldjNlU3NPVUxwSnVUdklGT0FZQU56ZE95RjhFbjdHbUg4N3YyVTZzcDFGM1RuRDVZdFBSZWoraTQKZEVlUUhxa0NnWUVBd3M5VTBWZ01yaC9ZQ2M2K3ZQRjdKVzJ4NncxTnU1MGp0dUlwSTJtV3gwUUM1UThNclVDMQpiNTYxekdnVzlXYVFMVHhHQ1lVSTZ0Znk0RDdic1ZIczVkazJYZ1poUnNJb1Z5aWJPSnp5Q0lIRGxoOW5tbUM5CndMYXBlU01TZFVCUThKNFJrQzV6VjFiWW1DRXZ0K1c1Zlp3bVhWcGlQeVpXUkJSK2xTSWhZR01DZ1lFQTdsamUKQm4vVFF1M2NHN0tsZStzdEtRaEwvNWxzRElaZ2loWGxLbWNjamx4K0VDdjZSbktPejl2SzBER09Uc1RVOHA4QgpZcjJTb0RxVm43S244eHBXWjJMMGhyaXhmQ3Z2eTRyWXFzQ3dTa2xGMUhlcFdCU3BkdU5aVzRyTDQ1RUlMUHhSCnVock8zcjRkSU1WTzBhVUYwZmxsY3o0aGdRSGNlK1RMT01wYzhTTUNnWUEyMC8yT01kYlh4dlNaeGd0ZXlDUWQKbzZMNGdiVUlBYkVFanVCL0svK1lzNmFRNjB4cEVwWStCUkFycUh3VnN6a08wakR3Q3ZZNGluQzc5bFVFc2djWApwYXVzaU9VbDhnMUNncFkxTjg3UzRCcTVETHV1OGwxVmVOTjMyWXdmWGV1cDNRTWFia2hlSTM0d1N0N1FSaUtQCm5Md2JlQTNBc2p5RFNyVlpxZEowK3dLQmdEdVRNT1BVL1h4RU1ma21YU0N0TnR1RHZHTkYrUERrZ2FyaU1DYTYKSVRRZ1FFNVFmNzB1RXk0M1ZPbFhDYWY4b1BHSDl2TzBTTHNPQ2FvaUlNS3QrWnpiNmh6bWUwNTdPUFBhWDYvRwpmQW9GYUpQajJRc3dGdStsZ2dkVW1RUG5rM0NUSE9aMG52S2orR25oaDRMMVNaQWpVMDFMNFZuNm1oN0pvRll3CmxxeWJBb0dBTDViT0JuNEd6SS92anVHczd3YTFNMGFlQ0hSYldPdUJmMXBSRUltR2JXNE91QU9BQmZHdTlPRGoKeUVkanVlRSszOW9tYzMzZitYWi9Cdk5HREZ3Q2tPQzRYRnVEZWhPeG4zaCtjbjg2Zzl3N3lOVDF2U1R2VVk1ZQorc295NUFTQUxJVElxRlJlQ1YwczlUdDlVVGtiSUI0Z240R0N5WVdmNUVTbXM2OG9hUkE9Ci0tLS0tRU5EIFJTQSBQUklWQVRFIEtFWS0tLS0tCg=="
//       }
//     }
//   ]
// })
// kc.loadFromString(kubeconfig);
kc.loadFromDefault();

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const batchV1Api = kc.makeApiClient(k8s.BatchV1Api);

@Service()
export default class KubeService {
  constructor(
    @Inject('logger') private logger,
    public mongoService:MongoService
  ) {}

  // Job functions

    public async EphemeralJob (fogapp_data){
      let jobName = 'auto-'+ uuidv4();
      let kubeconfig = await this.MergeKubeConfig()
      fogapp_data = JSON.stringify(fogapp_data)
      const job = {
        "apiVersion": "batch/v1",
        "kind": "Job",
        "metadata": {
          "name": `${jobName}`
        },
        "spec": {
          "template": {
            "spec": {
              "containers": [
                {
                  "name": "auto",
                  "image": `${config.schedulerImage}`,
                  "imagePullPolicy": "IfNotPresent",
                  "env": [
                    {
                      "name": "DATA",
                      "value": `${fogapp_data}`
                    },
                    {
                      "name": "KUBECONFIG",
                      "value":`${kubeconfig}`
                    }
                  ],
                  "resources": {
                    "requests": {
                      "cpu": "100m",
                      "memory": "1024Mi"
                    }
                  }
                }
              ],
              "restartPolicy": "Never"
            }
          },
          "backoffLimit": 1
        }
      }
      try{
        let log = await this.CreateAndReadLogJob(job,jobName)
        await this.DeleteJobAndPods(jobName)
        return new ResponseFormatJob().handler(log)
      }catch(e){
        this.logger.error(e)
      }
    }

    public async CreateAndReadLogJob(job,jobName){
      const watch = new k8s.Watch(kc);
      return new Promise(function (resolve, reject) {
        batchV1Api.createNamespacedJob('scheduler', job )
        .then(async(res)=>{
          watch.watch('/api/v1/namespaces/scheduler/pods',{ allowWatchBookmarks: true },
          async(type, apiObj, watchObj) =>{
            if (type === 'MODIFIED' && watchObj.object.metadata.generateName.startsWith(jobName)) {
              if(watchObj.object.status.phase == 'Succeeded'){
                const pod = watchObj.object.metadata.name
                k8sApi.readNamespacedPodLog(pod,'scheduler').then(async(res) => { resolve({log:res.body}) }).catch((err) => {reject({status:400,detail:err})})
              }
              if(watchObj.object.status.phase == 'Failed'){
                const pod = watchObj.object.metadata.name
                k8sApi.readNamespacedPodLog(pod,'scheduler').then((res)=>{ resolve({status:400,log:res.body})}).catch((err)=>{reject({status:400,detail:err})})
              }
            }
          },(err) => { reject({status:400,detail:err})})
        }).catch(async function(err){ reject({status:400,detail:err}) });
      });
    }

    public async DeleteJobAndPods(jobName){
      batchV1Api.deleteNamespacedJob(jobName,'scheduler').then((res)=>{
        k8sApi.deleteCollectionNamespacedPod('scheduler').then((res)=>{}).catch((err)=>{this.logger.error('☸️ Error deleting pods in namespace scheduler',err)})
      }).catch((err)=>this.logger.error('☸️ Error deleting job in namespace scheduler',err))
    }

    public async MergeKubeConfig(){
      let file = {
        'apiVersion':'v1',
        'clusters':[],
        'contexts':[],
        'current-context':'',
        'kind': 'Config',
        'preferences': {},
        'users':[]
      }
      const findAllCluster = await this.mongoService.GetAllClusters()
      findAllCluster.forEach(function(config){
        let kubeconfig = JSON.parse(JSON.stringify(load(config.config),2,null))
        file.clusters.push(kubeconfig.clusters[0])
        file.contexts.push(kubeconfig.contexts[0])
        file.users.push(kubeconfig.users[0])
      })
      file['current-context']= file.contexts.filter(ob => ob.name === 'cloud' ) ? 'cloud' : file.contexts[0].name
      file = JSON.stringify(file)
      return file
    }

}
