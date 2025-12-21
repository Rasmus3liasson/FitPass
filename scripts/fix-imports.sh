#!/bin/bash

# Fix imports in packages/shared/src
cd /Users/rasmuseliasson/dev/FitPass

echo "Fixing imports in packages/shared/src..."

# Fix @/src/hooks/* -> ../hooks or ./
find packages/shared/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e 's|from "@/src/hooks/\([^"]*\)"|from "../hooks/\1"|g' \
  -e 's|from '"'"'@/src/hooks/\([^'"'"']*\)'"'"'|from '"'"'../hooks/\1'"'"'|g' {} +

# Fix @/src/lib/* -> ../lib
find packages/shared/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e 's|from "@/src/lib/\([^"]*\)"|from "../lib/\1"|g' \
  -e 's|from '"'"'@/src/lib/\([^'"'"']*\)'"'"'|from '"'"'../lib/\1'"'"'|g' {} +

# Fix @/src/utils/* -> ../utils
find packages/shared/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e 's|from "@/src/utils/\([^"]*\)"|from "../utils/\1"|g' \
  -e 's|from '"'"'@/src/utils/\([^'"'"']*\)'"'"'|from '"'"'../utils/\1'"'"'|g' {} +

# Fix @/src/types -> ../types
find packages/shared/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e 's|from "@/src/types"|from "../types"|g' \
  -e 's|from '"'"'@/src/types'"'"'|from '"'"'../types'"'"'|g' {} +

# Fix @/types -> ../types
find packages/shared/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e 's|from "@/types"|from "../types"|g' \
  -e 's|from '"'"'@/types'"'"'|from '"'"'../types'"'"'|g' {} +

# Fix @/src/services/* -> ../services
find packages/shared/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e 's|from "@/src/services/\([^"]*\)"|from "../services/\1"|g' \
  -e 's|from '"'"'@/src/services/\([^'"'"']*\)'"'"'|from '"'"'../services/\1'"'"'|g' {} +

# Fix @/src/config/* -> ../config
find packages/shared/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e 's|from "@/src/config/\([^"]*\)"|from "../config/\1"|g' \
  -e 's|from '"'"'@/src/config/\([^'"'"']*\)'"'"'|from '"'"'../config/\1'"'"'|g' {} +

# Fix @/src/components/* -> ../components
find packages/shared/src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e 's|from "@/src/components/\([^"]*\)"|from "../components/\1"|g' \
  -e 's|from '"'"'@/src/components/\([^'"'"']*\)'"'"'|from '"'"'../components/\1'"'"'|g' {} +

echo "Fixed imports in packages/shared/src"

# Now fix imports in apps/mobile
echo "Fixing imports in apps/mobile..."

# Fix @/ imports to use @shared/* where appropriate
find apps/mobile/app -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e 's|from "@/src/hooks/\([^"]*\)"|from "@shared/hooks/\1"|g' \
  -e 's|from '"'"'@/src/hooks/\([^'"'"']*\)'"'"'|from '"'"'@shared/hooks/\1'"'"'|g' \
  -e 's|from "@/src/utils/\([^"]*\)"|from "@shared/utils/\1"|g' \
  -e 's|from '"'"'@/src/utils/\([^'"'"']*\)'"'"'|from '"'"'@shared/utils/\1'"'"'|g' \
  -e 's|from "@/src/types"|from "@shared/types"|g' \
  -e 's|from '"'"'@/src/types'"'"'|from '"'"'@shared/types'"'"'|g' \
  -e 's|from "@/types"|from "@shared/types"|g' \
  -e 's|from '"'"'@/types'"'"'|from '"'"'@shared/types'"'"'|g' \
  -e 's|from "@/src/services/\([^"]*\)"|from "@shared/services/\1"|g' \
  -e 's|from '"'"'@/src/services/\([^'"'"']*\)'"'"'|from '"'"'@shared/services/\1'"'"'|g' \
  -e 's|from "@/src/config/\([^"]*\)"|from "@shared/config/\1"|g' \
  -e 's|from '"'"'@/src/config/\([^'"'"']*\)'"'"'|from '"'"'@shared/config/\1'"'"'|g' \
  -e 's|from "@/src/lib/\([^"]*\)"|from "@shared/lib/\1"|g' \
  -e 's|from '"'"'@/src/lib/\([^'"'"']*\)'"'"'|from '"'"'@shared/lib/\1'"'"'|g' \
  -e 's|from "@/src/components/\([^"]*\)"|from "@shared/components/\1"|g' \
  -e 's|from '"'"'@/src/components/\([^'"'"']*\)'"'"'|from '"'"'@shared/components/\1'"'"'|g' {} +

echo "Fixed imports in apps/mobile"
echo "Done!"
