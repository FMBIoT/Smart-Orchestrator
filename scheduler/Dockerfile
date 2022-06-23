FROM python:3.7
RUN pip3 install kubernetes pint prometheus-api-client pandas
COPY utils.py /utils.py
COPY multiclusterscheduler.py /multiclusterscheduler.py
CMD python multiclusterscheduler.py