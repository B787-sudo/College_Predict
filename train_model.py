import pandas as pd
import numpy as np
import os
import joblib
import re
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder

# Atomic directories
os.makedirs('models', exist_ok=True)
os.makedirs('encoders', exist_ok=True)

print("Loading dataset...")
df = pd.read_csv('Dataset/CET DATA.csv')

# Dynamic Column Detection (Handling spaces/typos)
def find_col(target, cols):
    for c in cols:
        if target.lower() in c.lower(): return c
    return None

cols = df.columns
C_NAME = find_col('College Name', cols) or 'College Name'
C_COURSE = find_col('Course', cols) or 'Course'
C_SEAT = find_col('Seat Type', cols) or 'Seat Type'
C_RANK = find_col('Cutoff Rank', cols) or 'Cutoff Rank'
C_PERC = find_col('Percentile', cols) or 'Percentile'

print(f"Mapped Columns: {C_NAME}, {C_COURSE}, {C_SEAT}, {C_RANK}, {C_PERC}")

# Cleaning
df = df.dropna(subset=[C_NAME, C_COURSE, C_SEAT, C_RANK, C_PERC])
df[C_PERC] = pd.to_numeric(df[C_PERC], errors='coerce')
df = df.dropna(subset=[C_PERC])

# 1. Clean & Extract Region
def extract_region(name):
    parts = str(name).split(',')
    region = parts[-1].strip() if len(parts) > 1 else "Maharashtra"
    region = re.sub(r'\(.*?\)', '', region)
    region = re.sub(r'\d+', '', region)
    region = region.replace('.', '').strip()
    return region if len(region) > 2 else "Maharashtra"

df['Region'] = df[C_NAME].apply(extract_region)

major_cities = ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Amravati"]
all_regions = sorted(df['Region'].unique().tolist())
priority_regions = [c for c in major_cities if c in all_regions]
other_regions = [r for r in all_regions if r not in priority_regions]

# 2. Metadata for UI
ui_data = {
    'Colleges': sorted(df[C_NAME].unique().tolist()),
    'Courses': sorted(df[C_COURSE].unique().tolist()),
    'SeatTypes': sorted(df[C_SEAT].unique().tolist()),
    'Regions': priority_regions + other_regions,
    'Mapping': df.groupby([C_COURSE, C_SEAT]).apply(
        lambda g: g[[C_NAME, 'Region', C_PERC, C_RANK]].rename(
            columns={C_NAME: 'College Name', C_PERC: 'Percentile', C_RANK: 'Cutoff Rank'}
        ).to_dict('records')
    ).to_dict()
}
joblib.dump(ui_data, 'encoders/ui_data.pkl')

# 3. Data Synthesis
print("Synthesizing data...")
samples = []
for index, row in df.sample(min(len(df), 30000)).iterrows():
    c, cr, s, p = row[C_NAME], row[C_COURSE], row[C_SEAT], row[C_PERC]
    samples.append([c, cr, s, min(100, p+2), 'High'])
    samples.append([c, cr, s, p, 'Medium'])
    samples.append([c, cr, s, max(0, p-5), 'Low'])

train_df = pd.DataFrame(samples, columns=['College', 'Course', 'SeatType', 'Percentile', 'Probability'])

# 4. Encoding
le_college = LabelEncoder().fit(df[C_NAME])
le_course = LabelEncoder().fit(df[C_COURSE])
le_seattype = LabelEncoder().fit(df[C_SEAT])
le_prob = LabelEncoder().fit(['High', 'Low', 'Medium'])

train_df['College'] = le_college.transform(train_df['College'])
train_df['Course'] = le_course.transform(train_df['Course'])
train_df['SeatType'] = le_seattype.transform(train_df['SeatType'])
train_df['Probability'] = le_prob.transform(train_df['Probability'])

joblib.dump(le_college, 'encoders/le_college.pkl')
joblib.dump(le_course, 'encoders/le_course.pkl')
joblib.dump(le_seattype, 'encoders/le_seattype.pkl')
joblib.dump(le_prob, 'encoders/le_prob.pkl')

# 5. Train
print("Training Model...")
model = RandomForestClassifier(n_estimators=100, max_depth=15, random_state=42, n_jobs=-1)
model.fit(train_df[['College', 'Course', 'SeatType', 'Percentile']], train_df['Probability'])

joblib.dump(model, 'models/college_predictor_rf.pkl')
print("Metadata and Model updated successfully!")
