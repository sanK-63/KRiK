# Additional clean files
cmake_minimum_required(VERSION 3.16)

if("${CONFIG}" STREQUAL "" OR "${CONFIG}" STREQUAL "Debug")
  file(REMOVE_RECURSE
  "CMakeFiles\\CorporatePortal_autogen.dir\\AutogenUsed.txt"
  "CMakeFiles\\CorporatePortal_autogen.dir\\ParseCache.txt"
  "CorporatePortal_autogen"
  )
endif()
