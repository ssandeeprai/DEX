# First, let's analyze the attached Excel file to understand the KPIs and structure
import pandas as pd
import numpy as np

# Load the Excel file
df = pd.read_excel('DEX_ROI_KPI_Calculator_With_Consolidated.xlsx')

# Display basic info about the dataset
print("Dataset shape:", df.shape)
print("\nColumn names:")
print(df.columns.tolist())
print("\nFirst few rows:")
print(df.head())
print("\nData types:")
print(df.dtypes)