import json
import time

overall = dict()

data = list()
data.append(['Aap', 'Aap', 'Noot', 'Mies'])
data.append(['Noot', 'Aap', 'Noot', 'Mies'])
data.append(['Mies', 'Aap', 'Noot', 'Mies'])

overall['data'] = data
overall['answer'] = [-1] * len(data)
overall['numberOfMatches'] = len(data)
overall['lastChange'] = time.ctime()
overall['lastDownload'] = time.ctime()

with open('example.json', 'w') as f:
    json.dump(overall, f)
    