import json
import time

# The data for this tool is a dictionary stored in JSON format
dataset = dict()

# The data should be a list of lists (lines)
# The first element of each line is the string to be matched
# The second, and furher, elements are the matching options to choose from
data = list()
data.append(['Aap', 'Aap', 'Noot', 'Mies'])
data.append(['Noot', 'Aap', 'Noot', 'Mies'])
data.append(['Mies', 'Aap', 'Noot', 'Mies'])

# The dataset structure is as follows:
# 1. data - the data as structured above
# 2. project - a project name, preferable a string without spaces
# 3. answer - the answer list. It contains the following values:
#    -1 - for non answered questions
#    0, 1, 2 ... (n - 1) - chosen option 0 being the first possibility, (n - 1) the last
#    n - the answer "None of the above" has been chosen
# 4. numberOfMatches - length of the data list
# 5. lastChange & lastDownload - used inside the tool to show the user the last change & download
dataset['data'] = data
dataset['project'] = 'example'
dataset['answer'] = [-1] * len(data)
dataset['numberOfMatches'] = len(data)
dataset['lastChange'] = time.ctime()
dataset['lastDownload'] = time.ctime()

# Write the dataset to disk using the project name ("example" by default)
with open(f'{dataset["project"]}.json', 'w') as f:
    json.dump(dataset, f)
    