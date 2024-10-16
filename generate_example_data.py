import json
import time

project_name = 'example'

# The data for this tool is a dictionary stored in JSON format
dataset = dict()

# Add the data into a list
data = list()
data.append({'id': 0, 'keyword': 'Aap', 'suggestions': ['Aap', 'Noot', 'Mies'], 'matches': []})
data.append({'id': 1, 'keyword': 'Noot', 'suggestions': ['Aap', 'Noot', 'Mies'], 'matches': []})
data.append({'id': 2, 'keyword': 'Mies', 'suggestions': ['Aap', 'Noot', 'Mies'], 'matches': []})

# Create metadata
meta = list()
meta.append({'label': 'project', 'value': 'example'})
meta.append({'label': 'totalRecords', 'value': len(data)})
meta.append({'label': 'lastChange', 'value': time.ctime()})
meta.append({'label': 'lastDownload', 'value': time.ctime()})

# Create the dataset from the data with some metadata
dataset['data'] = data
dataset['meta'] = meta

# Write the dataset to disk using the project name ("example" by default)
with open(f'{project_name}.json', 'w') as f:
    json.dump(dataset, f)
    