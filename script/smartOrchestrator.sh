#!/bin/bash 
function install_prerequirements() {
    sudo apt-get install curl
    sudo apt-get install git
    sudo mkdir /mnt/data
    sudo touch /mnt/data/targets.json
}

function install_osm() {
    wget https://osm-download.etsi.org/ftp/osm-11.0-eleven/install_osm.sh
    chmod +x install_osm.sh
    ./install_osm.sh
    rm install_osm.sh
}

function install_prometheus_federate() {
    helm repo add --username framabio --password glpat--VpH6Jqgy48sZPYq87t_ assist-tools https://gitlab.assist-iot.eu/api/v4/projects/32/packages/helm/alpha
    helm repo update
    helm install assist-prometheus assist-tools/prometheus-federate
}

function install_prometheus_helm() {
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo update
    kubectl create ns monitoring
    helm install prometheus-community/kube-prometheus-stack --generate-name --set grafana.service.type=NodePort --set prometheus.service.type=NodePort --set prometheus.prometheusSpec.scrapeInterval="5s" --namespace monitoring
}

function install_api(){
    helm install assist-api assist-tools/smart-orchestator
}

function install_dashboard() {
    helm repo add --username ravaga --password glpat-BEzdhZ5zATjtAeFrMxQg dashboard https://gitlab.assist-iot.eu/api/v4/projects/79/packages/helm/alpha
    helm repo update
    helm install dashboard dashboard/dashboard --set frontend.service1.nodePort=30080
}

install_prerequirements
install_osm
install_prometheus_helm
install_prometheus_federate
install_api
install_dashboard