import pandas as pd

try:
    df = pd.read_csv('Dataset/CET DATA.csv')
    print("Columns:", list(df.columns))
    print("\nSummary Info:")
    df.info()
    print("\nUnique Branches (first 5):", df['Course'].unique()[:5] if 'Course' in df.columns else "N/A")
    print("\nUnique Categories (first 5):", df['Seat Type'].unique()[:5] if 'Seat Type' in df.columns else "N/A")
    print("\nSample Data:")
    print(df.head())
except Exception as e:
    print("Error:", str(e))
